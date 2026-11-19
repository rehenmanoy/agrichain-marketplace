import pool from "../../db/pool.js";
import { withTransaction } from "../../db/transaction.js";
import { badRequest, forbidden, notFound } from "../../utils/AppError.js";
import { WAREHOUSE_PHOTOS } from "../../utils/constants.js";
import { deletePhotoFiles, savePhotos } from "../../utils/uploads.js";
import { HOLD_END, SPACE_HOLDING, assertNoOpenBookings, capacityWindow, peakUsage } from "./capacity.js";

// available_capacity_kg is "free today": total space minus what bookings hold today.
// Free space for other dates comes from getAvailability.
const WAREHOUSE_SELECT = `
  SELECT
    w.id, w.name, w.location, w.region_id, r.name AS region_name,
    w.total_capacity_kg,
    w.total_capacity_kg - COALESCE((
      SELECT SUM(b.quantity_kg) FROM warehouse_bookings b
      WHERE b.warehouse_id = w.id AND b.status IN ${SPACE_HOLDING}
        AND b.start_date <= CURRENT_DATE AND CURRENT_DATE <= ${HOLD_END}
    ), 0) AS available_capacity_kg,
    w.price_per_kg_per_day, w.is_cold_storage, w.is_active, w.created_at,
    (SELECT COUNT(*) FROM warehouse_bookings b
     WHERE b.warehouse_id = w.id AND b.status IN ${SPACE_HOLDING})::int AS open_bookings,
    COALESCE((
      SELECT json_agg(
        json_build_object('id', p.id, 'url', '/uploads/warehouses/' || p.filename) ORDER BY p.position, p.id
      ) FROM warehouse_photos p WHERE p.warehouse_id = w.id
    ), '[]'::json) AS photos,
    wr.rating, COALESCE(wr.review_count, 0) AS review_count,
    u.id AS owner_id, u.name AS owner_name, u.phone AS owner_phone
  FROM warehouses w
  JOIN users u ON u.id = w.owner_id
  JOIN regions r ON r.id = w.region_id
  LEFT JOIN (
    SELECT warehouse_id, ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*) AS review_count
    FROM warehouse_reviews GROUP BY warehouse_id
  ) wr ON wr.warehouse_id = w.id`;

export async function browseWarehouses({ region_id, cold_storage }) {
  const conditions = ["w.is_active = TRUE", "w.deleted_at IS NULL"];
  const params = [];
  if (region_id) {
    params.push(region_id);
    conditions.push(`w.region_id = $${params.length}`);
  }
  if (cold_storage !== undefined) {
    params.push(cold_storage);
    conditions.push(`w.is_cold_storage = $${params.length}`);
  }

  const result = await pool.query(
    `${WAREHOUSE_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY w.price_per_kg_per_day ASC`,
    params,
  );
  return result.rows;
}

export async function getWarehouseById(warehouseId, db = pool) {
  const result = await db.query(`${WAREHOUSE_SELECT} WHERE w.id = $1 AND w.deleted_at IS NULL`, [warehouseId]);
  if (result.rowCount === 0) throw notFound("Warehouse not found");
  return result.rows[0];
}

export async function getOwnerWarehouses(ownerId) {
  const result = await pool.query(
    `${WAREHOUSE_SELECT} WHERE w.owner_id = $1 AND w.deleted_at IS NULL ORDER BY w.created_at DESC`,
    [ownerId],
  );
  return result.rows;
}

/** How much space is free for the whole of a date range (what a farmer can request) */
export async function getAvailability(warehouseId, { from, to }) {
  const warehouse = await getWarehouseById(warehouseId);
  const peak = await peakUsage(pool, warehouseId, from, to);
  return { warehouse_id: warehouse.id, from, to, free_kg: Math.max(0, warehouse.total_capacity_kg - peak) };
}

/** Locks a warehouse row and checks it belongs to this owner. */
async function lockOwnWarehouse(client, warehouseId, ownerId) {
  const result = await client.query(
    "SELECT id, owner_id, is_active FROM warehouses WHERE id = $1 AND deleted_at IS NULL FOR UPDATE",
    [warehouseId],
  );
  if (result.rowCount === 0) throw notFound("Warehouse not found");
  if (result.rows[0].owner_id !== ownerId) throw forbidden("You can only change your own warehouses");
  return result.rows[0];
}

/** The warehouse is always created in the owner's own region, with its photos. */
export async function createWarehouse(owner, data, files = []) {
  if (files.length < WAREHOUSE_PHOTOS.MIN) {
    throw badRequest(`Add at least ${WAREHOUSE_PHOTOS.MIN} photos of the warehouse`);
  }

  const filenames = await savePhotos(files);
  try {
    const warehouseId = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO warehouses
           (owner_id, region_id, name, location, total_capacity_kg, price_per_kg_per_day, is_cold_storage)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [owner.id, owner.regionId, data.name, data.location, data.total_capacity_kg, data.price_per_kg_per_day, data.is_cold_storage],
      );
      const id = result.rows[0].id;
      for (const [position, filename] of filenames.entries()) {
        await client.query("INSERT INTO warehouse_photos (warehouse_id, filename, position) VALUES ($1, $2, $3)", [
          id,
          filename,
          position,
        ]);
      }
      return id;
    });
    return getWarehouseById(warehouseId);
  } catch (err) {
    await deletePhotoFiles(filenames);
    throw err;
  }
}

const EDITABLE = ["name", "location", "total_capacity_kg", "price_per_kg_per_day", "is_cold_storage", "is_active"];

/**
 * Owner changes a warehouse. Space can't be cut below what is already booked, and a warehouse with
 * open bookings can't be paused. A new price only applies to future requests (bookings keep theirs).
 */
export async function updateWarehouse(warehouseId, ownerId, data) {
  await withTransaction(async (client) => {
    const warehouse = await lockOwnWarehouse(client, warehouseId, ownerId);

    if (data.is_active === false && warehouse.is_active) await assertNoOpenBookings(client, warehouseId);

    if (data.total_capacity_kg !== undefined) {
      const { today, horizon } = await capacityWindow(client);
      const booked = await peakUsage(client, warehouseId, today, horizon);
      if (data.total_capacity_kg < booked) {
        throw badRequest(`Space can't be below the ${booked} kg that is already booked or requested`);
      }
    }

    const columns = EDITABLE.filter((column) => data[column] !== undefined);
    const sets = columns.map((column, index) => `${column} = $${index + 2}`);
    await client.query(`UPDATE warehouses SET ${sets.join(", ")} WHERE id = $1`, [
      warehouseId,
      ...columns.map((column) => data[column]),
    ]);
  });
  return getWarehouseById(warehouseId);
}

/** Removes a warehouse from every list. The row stays (marked deleted) so past bookings keep their history. */
export async function deleteWarehouse(warehouseId, ownerId) {
  await withTransaction(async (client) => {
    await lockOwnWarehouse(client, warehouseId, ownerId);
    await assertNoOpenBookings(client, warehouseId);
    await client.query("UPDATE warehouses SET deleted_at = NOW(), is_active = FALSE WHERE id = $1", [warehouseId]);
  });
}

export async function addPhotos(warehouseId, ownerId, files = []) {
  if (files.length === 0) throw badRequest("Choose at least one photo");

  let filenames = [];
  try {
    await withTransaction(async (client) => {
      await lockOwnWarehouse(client, warehouseId, ownerId);
      const current = await client.query(
        "SELECT COUNT(*) AS count, COALESCE(MAX(position), -1) AS last FROM warehouse_photos WHERE warehouse_id = $1",
        [warehouseId],
      );
      const { count, last } = current.rows[0];
      if (count + files.length > WAREHOUSE_PHOTOS.MAX) {
        throw badRequest(`A warehouse can have at most ${WAREHOUSE_PHOTOS.MAX} photos`);
      }

      filenames = await savePhotos(files);
      for (const [index, filename] of filenames.entries()) {
        await client.query("INSERT INTO warehouse_photos (warehouse_id, filename, position) VALUES ($1, $2, $3)", [
          warehouseId,
          filename,
          last + 1 + index,
        ]);
      }
    });
  } catch (err) {
    await deletePhotoFiles(filenames);
    throw err;
  }
  return getWarehouseById(warehouseId);
}

export async function removePhoto(warehouseId, photoId, ownerId) {
  const removed = await withTransaction(async (client) => {
    await lockOwnWarehouse(client, warehouseId, ownerId);
    const count = await client.query("SELECT COUNT(*) AS count FROM warehouse_photos WHERE warehouse_id = $1", [
      warehouseId,
    ]);
    if (count.rows[0].count <= WAREHOUSE_PHOTOS.MIN) {
      throw badRequest(`A warehouse needs at least ${WAREHOUSE_PHOTOS.MIN} photos. Add another before removing this one.`);
    }
    const result = await client.query(
      "DELETE FROM warehouse_photos WHERE id = $1 AND warehouse_id = $2 RETURNING filename",
      [photoId, warehouseId],
    );
    if (result.rowCount === 0) throw notFound("Photo not found");
    return result.rows[0].filename;
  });

  await deletePhotoFiles([removed]);
  return getWarehouseById(warehouseId);
}

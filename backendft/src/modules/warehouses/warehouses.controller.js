import * as warehousesService from "./warehouses.service.js";

export async function browse(req, res) {
  res.json(await warehousesService.browseWarehouses(req.query));
}

export async function getOne(req, res) {
  res.json(await warehousesService.getWarehouseById(req.params.id));
}

export async function availability(req, res) {
  res.json(await warehousesService.getAvailability(req.params.id, req.query));
}

export async function mine(req, res) {
  res.json(await warehousesService.getOwnerWarehouses(req.user.id));
}

export async function create(req, res) {
  res.status(201).json(await warehousesService.createWarehouse(req.user, req.body, req.files));
}

export async function update(req, res) {
  res.json(await warehousesService.updateWarehouse(req.params.id, req.user.id, req.body));
}

export async function remove(req, res) {
  await warehousesService.deleteWarehouse(req.params.id, req.user.id);
  res.status(204).end();
}

export async function addPhotos(req, res) {
  res.status(201).json(await warehousesService.addPhotos(req.params.id, req.user.id, req.files));
}

export async function removePhoto(req, res) {
  res.json(await warehousesService.removePhoto(req.params.id, req.params.photoId, req.user.id));
}

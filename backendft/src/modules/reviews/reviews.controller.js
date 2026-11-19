import * as reviewsService from "./reviews.service.js";

export async function create(req, res) {
  res.status(201).json(await reviewsService.createReview(req.params.id, req.user.id, req.body));
}

export async function createPartner(req, res) {
  res.status(201).json(await reviewsService.createPartnerReview(req.params.id, req.user.id, req.body));
}

export async function createWarehouse(req, res) {
  res.status(201).json(await reviewsService.createWarehouseReview(req.params.id, req.user.id, req.body));
}

export async function list(req, res) {
  res.json(await reviewsService.getFarmerReviews(req.query.farmer_id));
}

export async function listPartner(req, res) {
  res.json(await reviewsService.getPartnerReviews(req.query.partner_id));
}

export async function listWarehouse(req, res) {
  res.json(await reviewsService.getWarehouseReviews(req.query.warehouse_id));
}

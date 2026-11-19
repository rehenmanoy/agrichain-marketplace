import * as listingsService from "./listings.service.js";

export async function browse(req, res) {
  res.json(await listingsService.browseListings(req.query));
}

export async function getOne(req, res) {
  res.json(await listingsService.getListingById(req.params.id));
}

export async function mine(req, res) {
  res.json(await listingsService.getFarmerListings(req.user.id));
}

export async function create(req, res) {
  res.status(201).json(await listingsService.createListing(req.user.id, req.body));
}

export async function update(req, res) {
  res.json(await listingsService.updateListing(req.params.id, req.user.id, req.body));
}

export async function deactivate(req, res) {
  res.json(await listingsService.deactivateListing(req.params.id, req.user.id));
}

export async function remove(req, res) {
  await listingsService.deleteListing(req.params.id, req.user.id);
  res.status(204).end();
}

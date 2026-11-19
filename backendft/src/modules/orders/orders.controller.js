import * as ordersService from "./orders.service.js";

export async function create(req, res) {
  res.status(201).json(await ordersService.createOrders(req.user, req.body));
}

export async function mine(req, res) {
  res.json(await ordersService.getBuyerOrders(req.user.id, req.query));
}

export async function incoming(req, res) {
  res.json(await ordersService.getFarmerOrders(req.user.id, req.query));
}

export async function cancel(req, res) {
  res.json(await ordersService.cancelOrder(req.params.id, req.user));
}

export async function confirm(req, res) {
  res.json(await ordersService.confirmOrder(req.params.id, req.user.id));
}

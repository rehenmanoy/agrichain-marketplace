import * as deliveriesService from "./deliveries.service.js";

export async function available(req, res) {
  res.json(await deliveriesService.getAvailableDeliveries(req.user));
}

export async function mine(req, res) {
  res.json(await deliveriesService.getPartnerDeliveries(req.user.id, req.query));
}

export async function accept(req, res) {
  res.json(await deliveriesService.acceptDelivery(req.params.orderId, req.user));
}

export async function complete(req, res) {
  res.json(await deliveriesService.completeDelivery(req.params.orderId, req.user.id));
}

export async function reportDelay(req, res) {
  res.json(await deliveriesService.reportDelay(req.params.orderId, req.user.id, req.body));
}

export async function release(req, res) {
  res.json(await deliveriesService.releaseDelivery(req.params.orderId, req.user.id));
}

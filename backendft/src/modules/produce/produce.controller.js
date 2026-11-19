import * as produceService from "./produce.service.js";

export async function list(req, res) {
  res.json(await produceService.listProduce(req.query));
}

export async function create(req, res) {
  res.status(201).json(await produceService.createProduce(req.user.id, req.body));
}

export async function prices(req, res) {
  res.json(await produceService.listMarketPrices());
}

export async function price(req, res) {
  res.json(await produceService.getProducePrice(req.params.id));
}

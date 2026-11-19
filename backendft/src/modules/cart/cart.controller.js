import * as cartService from "./cart.service.js";

export async function get(req, res) {
  res.json(await cartService.getCart(req.user.id, req.user.regionId));
}

export async function add(req, res) {
  res.status(201).json(await cartService.addToCart(req.user, req.body));
}

export async function update(req, res) {
  res.json(await cartService.updateCartItem(req.user, req.params.id, req.body.quantity));
}

export async function remove(req, res) {
  res.json(await cartService.removeCartItem(req.user, req.params.id));
}

export async function clear(req, res) {
  res.json(await cartService.clearCart(req.user));
}

export async function checkout(req, res) {
  res.status(201).json(await cartService.checkout(req.user, req.body));
}

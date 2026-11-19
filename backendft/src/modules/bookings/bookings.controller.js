import * as bookingsService from "./bookings.service.js";

export async function create(req, res) {
  res.status(201).json(await bookingsService.createBooking(req.user, req.body));
}

export async function mine(req, res) {
  res.json(await bookingsService.getFarmerBookings(req.user.id, req.query));
}

export async function incoming(req, res) {
  res.json(await bookingsService.getOwnerBookings(req.user.id, req.query));
}

export async function approve(req, res) {
  res.json(await bookingsService.approveBooking(req.params.id, req.user.id));
}

export async function reject(req, res) {
  res.json(await bookingsService.rejectBooking(req.params.id, req.user.id, req.body));
}

export async function cancel(req, res) {
  res.json(await bookingsService.cancelBooking(req.params.id, req.user.id));
}

export async function release(req, res) {
  res.json(await bookingsService.releaseBooking(req.params.id, req.user.id));
}

export async function extend(req, res) {
  res.status(201).json(await bookingsService.extendBooking(req.params.id, req.user.id, req.body));
}

export async function cancelExtension(req, res) {
  res.json(await bookingsService.cancelExtension(req.params.id, req.user.id));
}

export async function approveExtension(req, res) {
  res.json(await bookingsService.approveExtension(req.params.id, req.user.id));
}

export async function rejectExtension(req, res) {
  res.json(await bookingsService.rejectExtension(req.params.id, req.user.id));
}

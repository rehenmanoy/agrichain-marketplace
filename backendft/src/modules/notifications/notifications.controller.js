import * as notificationsService from "./notifications.service.js";

export async function list(req, res) {
  res.json(await notificationsService.listNotifications(req.user.id, req.query.limit));
}

export async function read(req, res) {
  res.json(await notificationsService.markRead(req.user.id, req.params.id));
}

export async function readAll(req, res) {
  res.json(await notificationsService.markAllRead(req.user.id));
}

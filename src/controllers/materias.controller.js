import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
  validateCreateMateria,
  validateMateriaId,
  validateMateriaListQuery,
  validatePatchMateria
} from "../validators/materias.validator.js";


/**
 * GET /api/v1/materias
 * Lista las materias del usuario autenticado, aplicando filtros, orden y paginación.
 *
 * @param {import("express").Request} request - Request de Express. Se espera `request.user.id`
 *   (usuario autenticado) y `request.query` con los filtros (activa, search, sort, order, page, limit).
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data, meta }`, donde `meta` trae la info de paginación.
 */
export async function listMaterias(request, response, next) {
  try {
    const filters = validateMateriaListQuery(request.query);
    const result = await materiasService.listMaterias(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/materias/:id
 * Obtiene el detalle de una materia puntual, siempre que pertenezca al usuario autenticado.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`
 *   (id de la materia) y `request.user.id` (usuario autenticado, dueño de la materia).
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data }` o 404 si la materia no existe o no es del usuario.
 */
export async function getMaterias(request, response, next){
  try{
    const  id  = validateMateriaId(request.params.id);
    const result = await materiasService.getMateriaById(id, request.user.id);
    return sendSuccess(response, result);
  } catch(error){
    return next(error);
  }
}

/**
 * GET /api/v1/materias/:id/tareas
 * Devuelve las tareas asociadas a una materia puntual del usuario autenticado.
 *
 * Primero valida que la materia exista y pertenezca al usuario (mismo chequeo de
 * `getMaterias`), y solo si es así consulta sus tareas. Esto evita filtrar tareas
 * de una materia que no le pertenece al usuario aunque el id exista en la base de datos.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`
 *   (id de la materia) y `request.user.id` (usuario autenticado, siempre se pasa el USERID).
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data }` (arreglo de tareas) o 404 si la
 *   materia no existe o no pertenece al usuario.
 */
export async function getTareasByMateria(request, response, next) {
  try {
    const materiaId = validateMateriaId(request.params.id);
    const tareas = await materiasService.getTareasByMateriaId(materiaId, request.user.id);
    return sendSuccess(response, tareas);
  } catch (error) {
    return next(error);
  }
}


/**
 * GET /api/v1/materias/:id/eventos
 * Devuelve los eventos asociados a una materia puntual del usuario autenticado.
 *
 * Igual que en `getTareasByMateria`, primero se valida que la materia exista y pertenezca
 * al usuario, y solo entonces se consultan sus eventos.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`
 *   (id de la materia) y `request.user.id` (usuario autenticado).
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data }` (arreglo de eventos, vacío si no hay),
 *   400 si el id es inválido o 404 si la materia no existe o no pertenece al usuario.
 */
export async function getEventosByMateria(request, response, next) {
  try {
    const materiaId = validateMateriaId(request.params.id);
    const eventos = await materiasService.getEventosByMateriaId(materiaId, request.user.id);
    return sendSuccess(response, eventos);
  } catch (error) {
    return next(error);
  }
}


/**
 * POST /api/v1/materias
 * Crea una nueva materia para el usuario autenticado.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.body`
 *   con los campos de la materia (nombre, codigo, color, creditos, activa) y `request.user.id`.
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 201 con `{ success, data }` (la materia creada) o error 409
 *   si el código o el nombre ya existen para ese usuario.
 */
export async function createMateria(request, response, next) {
  try {
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.createMateria(request.user.id, payload);
    return sendSuccess(response, materia, 201);
  } catch (error) {
    return next(error);
  }
}


/**
 * PUT /api/v1/materias/:id
 * Reemplaza por completo una materia existente del usuario autenticado.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`,
 *   `request.body` con todos los campos de la materia y `request.user.id`.
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data }` (la materia actualizada), 404 si no
 *   existe o no es del usuario, o 409 si el código o el nombre chocan con otra materia.
 */
export async function replaceMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.replaceMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/v1/materias/:id
 * Actualiza parcialmente una materia existente del usuario autenticado.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`,
 *   `request.body` con los campos a modificar (parcial) y `request.user.id`.
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 200 con `{ success, data }` (la materia actualizada), 404 si no
 *   existe o no es del usuario, o 409 si el código o el nombre chocan con otra materia.
 */
export async function updateMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validatePatchMateria(request.body);
    const materia = await materiasService.updateMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/materias/:id
 * Elimina una materia existente del usuario autenticado.
 *
 * @param {import("express").Request} request - Request de Express. Requiere `request.params.id`
 *   y `request.user.id`.
 * @param {import("express").Response} response - Response de Express.
 * @param {import("express").NextFunction} next - Callback para delegar errores al middleware de errores.
 * @returns {Promise<void>} Responde 204 sin contenido, o 404 si la materia no existe o no es del usuario.
 */
export async function deleteMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    await materiasService.removeMateria(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}


import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Lista las materias de un usuario aplicando filtros y paginación.
 *
 * @param {number} userId - Id del usuario dueño de las materias (siempre se pasa el USERID).
 * @param {{page: number, limit: number, activa?: boolean, search?: string, sort?: string, order?: string}} filters
 *   - Filtros ya validados (ver `validateMateriaListQuery`).
 * @returns {Promise<{data: object[], meta: {page: number, limit: number, total: number, pages: number}}>}
 *   Lista de materias y metadatos de paginación.
 */
export async function listMaterias(userId, filters) {
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);
  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Busca una materia por id, verificando que pertenezca al usuario indicado.
 *
 * @param {number} id - Id de la materia.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @throws {HttpError} 404 si la materia no existe o no pertenece al usuario.
 * @returns {Promise<object>} La materia encontrada.
 */
export async function getMateriaById(id, userId) {
const materia = await materiasRepository.findByIdAndUserId(id, userId);
  if (!materia) {
    throw new HttpError(404, "Materia no fue encontrada");
  }
  return materia;
}

/**
 * Devuelve las tareas de una materia, verificando primero que la materia
 * exista y pertenezca al usuario indicado.
 *
 * @param {number} materiaId - Id de la materia cuyas tareas se quieren consultar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @throws {HttpError} 404 si la materia no existe o no pertenece al usuario.
 * @returns {Promise<object[]>} Arreglo de tareas asociadas a la materia.
 */
export async function getTareasByMateriaId(materiaId, userId) {
  await getMateriaById(materiaId, userId);
  return materiasRepository.findTareasByMateriaId(materiaId, userId);
}


/**
 * Crea una materia nueva para un usuario, validando que el código y el nombre sean únicos.
 *
 * @param {number} userId - Id del usuario dueño de la nueva materia (siempre se pasa el USERID).
 * @param {object} materia - Datos de la materia ya validados (ver `validateCreateMateria`).
 * @throws {HttpError} 409 si ya existe una materia con el mismo código o nombre para ese usuario.
 * @returns {Promise<object>} La materia recién creada.
 */
export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}



/**
 * Verifica que el código y el nombre de una materia sean únicos para el usuario dado.
 *
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {object} materia - Datos de la materia a validar (puede ser parcial).
 * @param {number} [excludeId] - Id de materia a excluir de la búsqueda (para updates/replace).
 * @throws {HttpError} 409 con código `DUPLICATE_CODE` o `DUPLICATE_NAME` si hay colisión.
 * @returns {Promise<void>}
 */
async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}

/**
 * Reemplaza por completo los datos de una materia existente del usuario dado.
 *
 * @param {number} id - Id de la materia a reemplazar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {object} materia - Datos completos de la materia ya validados (ver `validateCreateMateria`).
 * @throws {HttpError} 404 si la materia no existe o no pertenece al usuario; 409 si el código o el
 *   nombre ya están en uso por otra materia del mismo usuario.
 * @returns {Promise<object>} La materia actualizada.
 */
export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.updateMateria(id, userId, materia);
}

/**
 * Actualiza parcialmente los datos de una materia existente del usuario dado.
 *
 * @param {number} id - Id de la materia a actualizar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {object} partialMateria - Campos a modificar, ya validados (ver `validatePatchMateria`).
 * @throws {HttpError} 404 si la materia no existe o no pertenece al usuario; 409 si el código o el
 *   nombre ya están en uso por otra materia del mismo usuario.
 * @returns {Promise<object>} La materia actualizada.
 */
export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

/**
 * Elimina una materia existente del usuario dado.
 *
 * @param {number} id - Id de la materia a eliminar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @throws {HttpError} 404 si la materia no existe o no pertenece al usuario.
 * @returns {Promise<void>}
 */
export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}


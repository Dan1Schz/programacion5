import { HttpError } from "../utils/http-error.js";

/**
 * Convierte un valor recibido (típicamente de query string) a booleano estricto.
 *
 * @param {*} value - Valor a convertir. `undefined` se deja pasar tal cual.
 * @throws {HttpError} 422 si el valor no es `undefined`, `true`/`"true"` ni `false`/`"false"`.
 * @returns {boolean|undefined} El booleano convertido, o `undefined` si `value` era `undefined`.
 */
function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(422, "VALIDATION_ERROR", "El filtro 'activa' debe ser true o false.");
}

/**
 * Valida y convierte un valor a entero mayor o igual a cero.
 *
 * @param {*} value - Valor a convertir. `undefined`, `null` o `""` devuelven `null`.
 * @param {string} fieldName - Nombre del campo, usado solo para el mensaje de error.
 * @throws {HttpError} 422 si el valor no es un entero mayor o igual a cero.
 * @returns {number|null} El entero convertido, o `null` si no se envió valor.
 */
function parsePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero positivo o cero.`);
  }

  return parsed;
}

/**
 * Valida que un valor sea un string no vacío y le quita espacios en los extremos.
 *
 * @param {*} value - Valor a validar.
 * @param {string} fieldName - Nombre del campo, usado en el mensaje de error.
 * @throws {HttpError} 422 si el valor no es un string o queda vacío tras el trim.
 * @returns {string} El string ya limpio.
 */
function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

/**
 * Valida que un color venga en formato hexadecimal `#RRGGBB`.
 *
 * @param {string} color - Color a validar.
 * @throws {HttpError} 422 si el formato no coincide con `#RRGGBB`.
 * @returns {void}
 */
function validateColor(color) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'color' debe tener formato hexadecimal #RRGGBB.");
  }
}

/**
 * Valida y normaliza los parámetros de query string para listar materias.
 *
 * @param {object} query - `request.query` de Express (page, limit, activa, search, sort, order).
 * @throws {HttpError} 422 si `page` o `limit` no son válidos, o si `activa` no es un booleano.
 * @returns {{activa: boolean|undefined, search: string, sort: string, order: string, page: number, limit: number}}
 *   Filtros ya validados y listos para pasar a la capa de servicio/repositorio.
 */
export function validateMateriaListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  return {
    activa: parseBoolean(query.activa),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };
}

/**
 * Valida que un id de materia (recibido como `request.params.id`, típicamente string) sea
 * un entero positivo. También se reutiliza para validar el `:id` del endpoint de tareas
 * (`GET /materias/:id/tareas`), ya que en ambos casos se trata del id de una materia.
 *
 * @param {*} id - Id recibido, normalmente como string desde la URL.
 * @throws {HttpError} 400 si no es un entero mayor o igual a 1.
 * @returns {number} El id ya convertido a número.
 */
export function validateMateriaId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de materia no es válido.");
  }

  return parsedId;
}

/**
 * Valida el cuerpo de la petición para crear (o reemplazar) una materia.
 *
 * @param {object} body - `request.body` de Express.
 * @throws {HttpError} 422 si falta algún campo obligatorio o el formato de `color` es inválido.
 * @returns {{nombre: string, codigo: string, color: string, creditos: number|null, activa: boolean}}
 *   Datos de la materia ya validados y normalizados.
 */
export function validateCreateMateria(body) {
  const nombre = normalizeString(body.nombre, "nombre");
  const codigo = normalizeString(body.codigo, "codigo");
  const color = normalizeString(body.color, "color");
  const creditos = parsePositiveInteger(body.creditos, "creditos");
  const activa = body.activa === undefined ? true : parseBoolean(body.activa);

  validateColor(color);

  return {
    nombre,
    codigo,
    color,
    creditos,
    activa
  };
}

/**
 * Valida el cuerpo de la petición para actualizar parcialmente una materia.
 * Solo incluye en el resultado los campos que realmente vinieron en el body.
 *
 * @param {object} body - `request.body` de Express.
 * @throws {HttpError} 422 si no se envía ningún campo válido, o si algún campo enviado es inválido.
 * @returns {object} Objeto parcial con los campos a actualizar, ya validados.
 */
export function validatePatchMateria(body) {
  const payload = {};

  if (body.nombre !== undefined) {
    payload.nombre = normalizeString(body.nombre, "nombre");
  }

  if (body.codigo !== undefined) {
    payload.codigo = normalizeString(body.codigo, "codigo");
  }

  if (body.color !== undefined) {
    payload.color = normalizeString(body.color, "color");
    validateColor(payload.color);
  }

  if (body.creditos !== undefined) {
    payload.creditos = parsePositiveInteger(body.creditos, "creditos");
  }

  if (body.activa !== undefined) {
    payload.activa = parseBoolean(body.activa);
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}

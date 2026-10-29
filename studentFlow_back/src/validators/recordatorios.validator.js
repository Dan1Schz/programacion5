import { HttpError } from "../utils/http-error.js";

// ASUMIDO: el DER marca "canal" como enum (recordatorio_canal_enum) pero no muestra sus valores.
// Ajusta esta lista para que coincida con el ENUM real de tu base de datos.
export const CANALES_PERMITIDOS = ["app", "email", "push"];

const sortableFields = ["id", "fechaHora", "canal", "createdAt"];
const FECHA_HORA_REGEX = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

function parseBoolean(value, fieldName) {
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

  throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser true o false.`);
}

function parseId(value, fieldName) {
  const parsed = Number(value);

  if (value === undefined || value === null || value === "" || !Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero mayor que cero.`);
  }

  return parsed;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

function normalizeMensaje(value) {
  const mensaje = normalizeString(value, "mensaje");

  if (mensaje.length > 255) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede superar 255 caracteres.");
  }

  return mensaje;
}

/** Acepta "YYYY-MM-DD HH:mm[:ss]" o "YYYY-MM-DDTHH:mm[:ss]" y lo devuelve como "YYYY-MM-DD HH:mm:ss". */
function normalizeFechaHora(value, fieldName = "fechaHora") {
  const text = normalizeString(value, fieldName);
  const match = FECHA_HORA_REGEX.exec(text);

  if (!match) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe tener formato YYYY-MM-DDTHH:mm.`);
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
  const isReal = date.getUTCFullYear() === +year
    && date.getUTCMonth() === +month - 1
    && date.getUTCDate() === +day
    && +hour < 24 && +minute < 60 && +second < 60;

  if (!isReal) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' no es una fecha y hora válida.`);
  }

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function normalizeCanal(value) {
  const canal = normalizeString(value, "canal").toLowerCase();

  if (!CANALES_PERMITIDOS.includes(canal)) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo 'canal' debe ser uno de: ${CANALES_PERMITIDOS.join(", ")}.`);
  }

  return canal;
}

export function validateRecordatorioId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de recordatorio no es válido.");
  }

  return parsedId;
}

export function validateRecordatorioListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  const hasValue = (value) => value !== undefined && value !== "";

  return {
    leido: hasValue(query.leido) ? parseBoolean(query.leido, "leido") : undefined,
    canal: hasValue(query.canal) ? normalizeCanal(query.canal) : undefined,
    tareaId: hasValue(query.tareaId) ? parseId(query.tareaId, "tareaId") : undefined,
    materiaId: hasValue(query.materiaId) ? parseId(query.materiaId, "materiaId") : undefined,
    desde: hasValue(query.desde) ? normalizeFechaHora(query.desde, "desde") : undefined,
    hasta: hasValue(query.hasta) ? normalizeFechaHora(query.hasta, "hasta") : undefined,
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: sortableFields.includes(query.sort) ? query.sort : undefined,
    order: query.order,
    page,
    limit
  };
}

export function validateCreateRecordatorio(body = {}) {
  return {
    tareaId: parseId(body.tareaId, "tareaId"),
    mensaje: normalizeMensaje(body.mensaje),
    fechaHora: normalizeFechaHora(body.fechaHora),
    canal: normalizeCanal(body.canal),
    leido: body.leido === undefined ? false : parseBoolean(body.leido, "leido")
  };
}

export function validatePatchRecordatorio(body = {}) {
  const payload = {};

  if (body.tareaId !== undefined) {
    payload.tareaId = parseId(body.tareaId, "tareaId");
  }

  if (body.mensaje !== undefined) {
    payload.mensaje = normalizeMensaje(body.mensaje);
  }

  if (body.fechaHora !== undefined) {
    payload.fechaHora = normalizeFechaHora(body.fechaHora);
  }

  if (body.canal !== undefined) {
    payload.canal = normalizeCanal(body.canal);
  }

  if (body.leido !== undefined) {
    payload.leido = parseBoolean(body.leido, "leido");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}

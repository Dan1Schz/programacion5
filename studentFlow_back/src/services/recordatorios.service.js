import * as recordatoriosRepository from "../repositories/recordatorios.repository.js";
import { HttpError } from "../utils/http-error.js";

/** La tarea referenciada debe existir y ser del usuario; así no se enlazan recordatorios a tareas ajenas. */
async function ensureTareaOwned(userId, tareaId) {
  const belongs = await recordatoriosRepository.tareaBelongsToUser(tareaId, userId);

  if (!belongs) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "La tarea indicada no fue encontrada.");
  }
}

export async function listRecordatorios(userId, filters) {
  const { recordatorios, total } = await recordatoriosRepository.findAllByUserId(userId, filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getRecordatorioById(id, userId) {
  const recordatorio = await recordatoriosRepository.findByIdAndUserId(id, userId);

  if (!recordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "El recordatorio no fue encontrado.");
  }

  return recordatorio;
}

export async function createRecordatorio(userId, recordatorio) {
  await ensureTareaOwned(userId, recordatorio.tareaId);
  const insertId = await recordatoriosRepository.createRecordatorio(recordatorio);
  return getRecordatorioById(insertId, userId);
}

export async function replaceRecordatorio(id, userId, recordatorio) {
  await getRecordatorioById(id, userId);
  await ensureTareaOwned(userId, recordatorio.tareaId);
  return recordatoriosRepository.updateRecordatorio(id, userId, recordatorio);
}

export async function updateRecordatorio(id, userId, partialRecordatorio) {
  await getRecordatorioById(id, userId);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaOwned(userId, partialRecordatorio.tareaId);
  }

  return recordatoriosRepository.patchRecordatorio(id, userId, partialRecordatorio);
}

export async function removeRecordatorio(id, userId) {
  await getRecordatorioById(id, userId);
  await recordatoriosRepository.deleteRecordatorio(id, userId);
}

import { pool } from "../config/database.js";

// recordatorio -> tarea -> materia -> usuario.
// El dueño del recordatorio se resuelve con JOIN: m.id_usuario debe coincidir con el usuario actual.
const baseSelect = `
  SELECT
    r.id_recordatorio AS id,
    r.id_tarea AS tareaId,
    t.titulo AS tareaTitulo,
    t.id_materia AS materiaId,
    m.nombre AS materiaNombre,
    m.color AS materiaColor,
    r.mensaje,
    r.fecha_hora AS fechaHora,
    r.canal,
    r.leido,
    r.created_at AS createdAt
  FROM recordatorio r
  INNER JOIN tarea t ON t.id_tarea = r.id_tarea
  INNER JOIN materia m ON m.id_materia = t.id_materia`;

const sortableFields = {
  id: "r.id_recordatorio",
  fechaHora: "r.fecha_hora",
  canal: "r.canal",
  createdAt: "r.created_at"
};

// Subconsulta reutilizable: tareas que pertenecen al usuario.
const userTareasSubquery = `
  SELECT t2.id_tarea
  FROM tarea t2
  INNER JOIN materia m2 ON m2.id_materia = t2.id_materia
  WHERE m2.id_usuario = ?`;

function normalizeSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fechaHora;
  const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
  return `${column} ${direction}, r.id_recordatorio ASC`;
}

function mapRecordatorio(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    tareaTitulo: row.tareaTitulo,
    materiaId: row.materiaId,
    materiaNombre: row.materiaNombre,
    materiaColor: row.materiaColor,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt
  };
}

export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  if (filters.canal) {
    conditions.push("r.canal = ?");
    params.push(filters.canal);
  }

  if (filters.tareaId) {
    conditions.push("r.id_tarea = ?");
    params.push(filters.tareaId);
  }

  if (filters.materiaId) {
    conditions.push("t.id_materia = ?");
    params.push(filters.materiaId);
  }

  if (filters.desde) {
    conditions.push("r.fecha_hora >= ?");
    params.push(filters.desde);
  }

  if (filters.hasta) {
    conditions.push("r.fecha_hora <= ?");
    params.push(filters.hasta);
  }

  if (filters.search) {
    conditions.push("(r.mensaje LIKE ? OR t.titulo LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.join(" AND ");

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE ${where}`,
    params
  );

  const orderBy = normalizeSort(filters.sort, filters.order);
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

  const [rows] = await pool.execute(
    `${baseSelect}
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorio),
    total: countRows[0].total
  };
}

export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `${baseSelect}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapRecordatorio(rows[0]) : null;
}

/** Comprueba que la tarea exista y pertenezca (vía su materia) al usuario. */
export async function tareaBelongsToUser(tareaId, userId) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [tareaId, userId]
  );

  return rows.length > 0;
}

export async function createRecordatorio(recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return result.insertId;
}

export async function updateRecordatorio(id, userId, recordatorio) {
  await pool.execute(
    `UPDATE recordatorio
     SET id_tarea = ?, mensaje = ?, fecha_hora = ?, canal = ?, leido = ?
     WHERE id_recordatorio = ? AND id_tarea IN (${userTareasSubquery})`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0,
      id,
      userId
    ]
  );

  return findByIdAndUserId(id, userId);
}

export async function patchRecordatorio(id, userId, partial) {
  const columns = {
    tareaId: "id_tarea",
    mensaje: "mensaje",
    fechaHora: "fecha_hora",
    canal: "canal",
    leido: "leido"
  };
  const fields = [];
  const params = [];

  for (const [key, column] of Object.entries(columns)) {
    if (partial[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(key === "leido" ? (partial[key] ? 1 : 0) : partial[key]);
    }
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id, userId);

  await pool.execute(
    `UPDATE recordatorio
     SET ${fields.join(", ")}
     WHERE id_recordatorio = ? AND id_tarea IN (${userTareasSubquery})`,
    params
  );

  return findByIdAndUserId(id, userId);
}

export async function deleteRecordatorio(id, userId) {
  const [result] = await pool.execute(
    `DELETE FROM recordatorio
     WHERE id_recordatorio = ? AND id_tarea IN (${userTareasSubquery})`,
    [id, userId]
  );

  return result.affectedRows > 0;
}

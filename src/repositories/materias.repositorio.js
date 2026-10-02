import { pool } from "../config/database.js";
const sortableFields = {
    id: "m.id_materia",
    nombre: "m.nombre",
    codigo: "m.codigo",
    creditos: "m.creditos",
    color: "m.color",
    activa: "m.activa",
    createdAt: "m.created_at",
    updatedAt: "m.updated_at"
};
/**
 * Traduce un par (sort, order) recibido por query string a una cláusula ORDER BY segura.
 * Si `sort` no es una columna permitida, se ordena por nombre.
 *
 * @param {string} sort - Nombre lógico del campo a ordenar (ver `sortableFields`).
 * @param {string} order - Dirección solicitada ("asc" o "desc").
 * @returns {string} Fragmento SQL listo para usar después de `ORDER BY`.
 */
function normalizeSort(sort, order) {
    const column = sortableFields[sort] || sortableFields.nombre;
    const direction = String(order).toLocaleLowerCase() === "desc" ? "DESC" : "ASC";

    return `${column} ${direction}`;
}
/**
 * Mapea una fila cruda de la tabla `materia` al objeto materia que expone la API.
 *
 * @param {object} row - Fila devuelta por MySQL para la tabla `materia`.
 * @returns {object} Materia con nombres de campo en camelCase.
 */
function mapMateriaRow(row) {
    return {
        id: row.id ?? row.id_materia,
        nombre: row.nombre,
        codigo: row.codigo,
        creditos: row.creditos,
        color: row.color,
        activa: row.activa,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Mapea una fila cruda de la tabla `tarea` al objeto tarea que expone la API.
 *
 * Nota: se asume un esquema de tabla `tarea` con columnas
 * `id_tarea, id_materia, titulo, descripcion, fecha_limite, estado, created_at, updated_at`.
 * Ajusta esta función (y la consulta de `findTareasByMateriaId`) si tu esquema real difiere.
 *
 * @param {object} row - Fila devuelta por MySQL para la tabla `tarea`.
 * @returns {object} Tarea con nombres de campo en camelCase.
 */
function mapTareaRow(row) {
    return {
        id: row.id ?? row.id_tarea,
        materiaId: row.materiaId ?? row.id_materia,
        titulo: row.titulo,
        descripcion: row.descripcion,
        fechaLimite: row.fecha_limite,
        estado: row.estado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Mapea una fila cruda de la tabla `evento` al objeto evento que expone la API.
 *
 * Nota: se asume un esquema de tabla `evento` con columnas
 * `id_evento, id_materia, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, tipo,
 * created_at, updated_at`. Ajusta esta función (y la consulta de `findEventosByMateriaId`)
 * si tu esquema real difiere.
 *
 * @param {object} row - Fila devuelta por MySQL para la tabla `evento`.
 * @returns {object} Evento con nombres de campo en camelCase.
 */
function mapEventoRow(row) {
    return {
        id: row.id ?? row.id_evento,
        materiaId: row.materiaId ?? row.id_materia,
        titulo: row.titulo,
        descripcion: row.descripcion,
        fechaInicio: row.fecha_inicio,
        fechaFin: row.fecha_fin,
        ubicacion: row.ubicacion,
        tipo: row.tipo,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Busca las materias de un usuario aplicando filtros, orden y paginación, y calcula el total
 * de resultados (sin paginar) para armar la metadata de paginación.
 *
 * @param {number} userId - Id del usuario dueño de las materias (siempre se pasa el USERID).
 * @param {{activa?: boolean, search?: string, sort?: string, order?: string, page: number, limit: number}} [filters]
 *   - Filtros ya validados.
 * @returns {Promise<{materias: object[], total: number}>} Materias de la página solicitada y el total general.
 */
export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];
  if (typeof filters.activa === "boolean") {
    conditions.push("m.activa = ?");
    params.push(filters.activa ? 1 : 0);
  }
  if (filters.search) {
    conditions.push("(m.nombre LIKE ? OR m.codigo LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM materia m
     WHERE ${conditions.join(" AND ")}`,
    params
  );
  const orderBy = normalizeSort(filters.sort, filters.order);
  // limit y page ya vienen validados como enteros (validateMateriaListQuery), por eso
  // se interpolan: algunas versiones de MySQL rechazan LIMIT ? en sentencias preparadas.
  const limit = Number(filters.limit);
  const offset = (Number(filters.page) - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT
       m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at,
       m.updated_at
     FROM materia m
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return {
    materias: rows.map(mapMateriaRow),
    total: countRows[0].total
  };
}

/**
 * Busca una materia puntual por id, verificando que pertenezca al usuario indicado.
 *
 * @param {number} id - Id de la materia.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @returns {Promise<object|null>} La materia mapeada, o `null` si no existe o no es del usuario.
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
    m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at,
       m.updated_at
     FROM materia m
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

    return rows[0] ? mapMateriaRow(rows[0]) : null;
}


/**
 * Verifica si ya existe una materia con el código dado para un usuario.
 *
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {string} codigo - Código a verificar.
 * @param {number} [excludeId] - Id de materia a excluir de la búsqueda (útil al actualizar).
 * @returns {Promise<boolean>} `true` si ya existe otra materia con ese código.
 */
export async function existsByCode(userId, codigo, excludeId) {
  const params = [userId, codigo];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND codigo = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

/**
 * Verifica si ya existe una materia con el nombre dado para un usuario.
 *
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {string} nombre - Nombre a verificar.
 * @param {number} [excludeId] - Id de materia a excluir de la búsqueda (útil al actualizar).
 * @returns {Promise<boolean>} `true` si ya existe otra materia con ese nombre.
 */
export async function existsByName(userId, nombre, excludeId) {
  const params = [userId, nombre];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND nombre = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}
       

/**
 * Inserta una nueva materia para un usuario y devuelve el registro creado.
 *
 * @param {number} userId - Id del usuario dueño de la nueva materia (siempre se pasa el USERID).
 * @param {{nombre: string, codigo: string, color: string, creditos: number, activa: boolean}} materia
 *   - Datos de la materia a crear.
 * @returns {Promise<object>} La materia recién creada, ya mapeada.
 */
export async function createMateria(userId, materia) {
  const [result] = await pool.execute(
    `INSERT INTO materia (id_usuario, nombre, codigo, color, creditos, activa)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      materia.nombre,
      materia.codigo,
      materia.color,
      materia.creditos,
      materia.activa ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

/**
 * Actualiza parcialmente los campos provistos de una materia del usuario dado.
 * Si no se envía ningún campo, simplemente devuelve la materia sin modificarla.
 *
 * @param {number} id - Id de la materia a actualizar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @param {object} partialMateria - Campos a modificar (nombre, codigo, color, creditos, activa), parcial.
 * @returns {Promise<object|null>} La materia actualizada, ya mapeada.
 */
export async function patchMateria(id, userId, partialMateria) {
  const fields = [];
  const params = [];

  if (partialMateria.nombre !== undefined) {
    fields.push("nombre = ?");
    params.push(partialMateria.nombre);
  }

  if (partialMateria.codigo !== undefined) {
    fields.push("codigo = ?");
    params.push(partialMateria.codigo);
  }

  if (partialMateria.color !== undefined) {
    fields.push("color = ?");
    params.push(partialMateria.color);
  }

  if (partialMateria.creditos !== undefined) {
    fields.push("creditos = ?");
    params.push(partialMateria.creditos);
  }

  if (partialMateria.activa !== undefined) {
    fields.push("activa = ?");
    params.push(partialMateria.activa ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id, userId);

  await pool.execute(
    `UPDATE materia
     SET ${fields.join(", ")}
     WHERE id_materia = ? AND id_usuario = ?`,
    params
  );

  return findByIdAndUserId(id, userId);
}


/**
 * Elimina una materia de un usuario dado.
 *
 * @param {number} id - Id de la materia a eliminar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @returns {Promise<boolean>} `true` si se eliminó una fila, `false` si no existía.
 */
export async function deleteMateria(id, userId) {
  const [result] = await pool.execute(
    "DELETE FROM materia WHERE id_materia = ? AND id_usuario = ?",
    [id, userId]
  );

  return result.affectedRows > 0;
}

/**
 * Busca las tareas asociadas a una materia, verificando en el mismo JOIN que la materia
 * pertenezca al usuario indicado (defensa adicional: la capa de servicio ya valida esto
 * antes de llamar aquí, pero el filtro por `id_usuario` evita filtrar tareas de una
 * materia ajena si esta función se reutiliza en otro lugar).
 *
 * Nota: se asume un esquema de tabla `tarea` con columnas
 * `id_tarea, id_materia, titulo, descripcion, fecha_limite, estado, created_at, updated_at`.
 * Ajusta la consulta si tu esquema real usa otros nombres de columna.
 *
 * @param {number} materiaId - Id de la materia cuyas tareas se quieren consultar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @returns {Promise<object[]>} Tareas de la materia, ya mapeadas, ordenadas por fecha límite.
 */
export async function findTareasByMateriaId(materiaId, userId) {
  const [rows] = await pool.execute(
    `SELECT
       t.id_tarea AS id,
       t.id_materia AS materiaId,
       t.titulo,
       t.descripcion,
       t.fecha_limite,
       t.estado,
       t.created_at,
       t.updated_at
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_materia = ? AND m.id_usuario = ?
     ORDER BY t.fecha_limite ASC`,
    [materiaId, userId]
  );

  return rows.map(mapTareaRow);
}

/**
 * Busca los eventos asociados a una materia, verificando en el mismo JOIN que la materia
 * pertenezca al usuario indicado (la capa de servicio ya valida esto antes de llamar aquí,
 * pero el filtro por `id_usuario` evita filtrar eventos de una materia ajena si esta
 * función se reutiliza en otro lugar).
 *
 * Nota: se asume un esquema de tabla `evento` con columnas
 * `id_evento, id_materia, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, tipo,
 * created_at, updated_at`. Ajusta la consulta si tu esquema real usa otros nombres de columna.
 *
 * @param {number} materiaId - Id de la materia cuyos eventos se quieren consultar.
 * @param {number} userId - Id del usuario dueño de la materia (siempre se pasa el USERID).
 * @returns {Promise<object[]>} Eventos de la materia, ya mapeados, ordenados por fecha de inicio.
 */
export async function findEventosByMateriaId(materiaId, userId) {
  const [rows] = await pool.execute(
    `SELECT
       e.id_evento AS id,
       e.id_materia AS materiaId,
       e.titulo,
       e.descripcion,
       e.fecha_inicio,
       e.fecha_fin,
       e.ubicacion,
       e.tipo,
       e.created_at,
       e.updated_at
     FROM evento e
     INNER JOIN materia m ON m.id_materia = e.id_materia
     WHERE e.id_materia = ? AND m.id_usuario = ?
     ORDER BY e.fecha_inicio ASC`,
    [materiaId, userId]
  );

  return rows.map(mapEventoRow);
}

const API_URL = '/api/v1/proyectos/?limit=100';
const resultado = document.querySelector('#resultado');
const NUM_COLUMNAS = 7;

async function solicitarAPI(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    return respuesta.status === 204 ? null : respuesta.json();
}

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function formatearFecha(valor) {
    if (!valor) return '';
    const fecha = new Date(valor);
    return isNaN(fecha) ? String(valor) : fecha.toLocaleDateString('es-CO');
}

function formatearCosto(valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    return Number(valor).toLocaleString('es-CO');
}

async function mostrarProyectos() {
    try {
        const datos = await solicitarAPI(API_URL);
        const proyectos = datos?.data ?? [];

        if (proyectos.length === 0) {
            resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">No existen filas</td></tr>`;
            return;
        }

        let html = proyectos.map(p => `
            <tr>
                <td>${escapar(p.id)}</td>
                <td>${escapar(p.cliente?.nombre ?? p.clienteId)}</td>
                <td>${escapar(p.oficina?.nombre ?? p.oficinaId)}</td>
                <td>${escapar(p.proyecto)}</td>
                <td>${escapar(formatearFecha(p.fechaInicioProyecto))}</td>
                <td>${escapar(formatearFecha(p.fechaFinProyecto))}</td>
                <td>${escapar(formatearCosto(p.costoProyecto))}</td>
            </tr>`).join('');

        const total = datos?.meta?.total ?? proyectos.length;
        if (total > proyectos.length) {
            html += `<tr><td colspan="${NUM_COLUMNAS}">Mostrando ${proyectos.length} de ${total} registros</td></tr>`;
        }
        resultado.innerHTML = html;
    } catch (error) {
        console.error(error);
        resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">Error al cargar los datos</td></tr>`;
    }
}

mostrarProyectos();
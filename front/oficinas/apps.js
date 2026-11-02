const API_URL = '/api/v1/oficinas/?limit=100';
const resultado = document.querySelector('#resultado');
const NUM_COLUMNAS = 2;

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

async function mostrarOficinas() {
    try {
        const datos = await solicitarAPI(API_URL);
        const oficinas = datos?.data ?? [];

        if (oficinas.length === 0) {
            resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">No existen filas</td></tr>`;
            return;
        }

        let html = oficinas.map(o => `
            <tr>
                <td>${escapar(o.id)}</td>
                <td>${escapar(o.nombre)}</td>
            </tr>`).join('');

        const total = datos?.meta?.total ?? oficinas.length;
        if (total > oficinas.length) {
            html += `<tr><td colspan="${NUM_COLUMNAS}">Mostrando ${oficinas.length} de ${total} registros</td></tr>`;
        }
        resultado.innerHTML = html;
    } catch (error) {
        console.error(error);
        resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">Error al cargar los datos</td></tr>`;
    }
}

mostrarOficinas();
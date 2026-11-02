const API_URL = '/api/v1/ciudades/?limit=100';
const resultado = document.querySelector('#resultado');
const NUM_COLUMNAS = 3;

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

async function mostrarCiudades() {
    try {
        const datos = await solicitarAPI(API_URL);
        const ciudades = datos?.data ?? [];

        if (ciudades.length === 0) {
            resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">No existen filas</td></tr>`;
            return;
        }

        let html = ciudades.map(c => `
            <tr>
                <td>${escapar(c.id)}</td>
                <td>${escapar(c.ciudad)}</td>
                <td>${escapar(c.pais)}</td>
            </tr>`).join('');

        const total = datos?.meta?.total ?? ciudades.length;
        if (total > ciudades.length) {
            html += `<tr><td colspan="${NUM_COLUMNAS}">Mostrando ${ciudades.length} de ${total} registros</td></tr>`;
        }
        resultado.innerHTML = html;
    } catch (error) {
        console.error(error);
        resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">Error al cargar los datos</td></tr>`;
    }
}

mostrarCiudades();
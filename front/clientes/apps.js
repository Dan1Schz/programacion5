const API_URL = '/api/v1/clientes/?limit=100';
const resultado = document.querySelector('#resultado');
const NUM_COLUMNAS = 5;

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

async function mostrarClientes() {
    try {
        const datos = await solicitarAPI(API_URL);
        const clientes = datos?.data ?? [];

        if (clientes.length === 0) {
            resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">No existen filas</td></tr>`;
            return;
        }

        let html = clientes.map(c => `
            <tr>
                <td>${escapar(c.id)}</td>
                <td>${escapar(c.ciudad?.ciudad ?? c.ciudadId)}</td>
                <td>${escapar(c.nombre)}</td>
                <td>${escapar(c.telefono)}</td>
                <td>${escapar(c.segmento)}</td>
            </tr>`).join('');

        const total = datos?.meta?.total ?? clientes.length;
        if (total > clientes.length) {
            html += `<tr><td colspan="${NUM_COLUMNAS}">Mostrando ${clientes.length} de ${total} registros</td></tr>`;
        }
        resultado.innerHTML = html;
    } catch (error) {
        console.error(error);
        resultado.innerHTML = `<tr><td colspan="${NUM_COLUMNAS}">Error al cargar los datos</td></tr>`;
    }
}

mostrarClientes();
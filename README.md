# StudentFlow backend

## Instalación

1. Instala Node.js y MySQL.
2. Abre una terminal en esta carpeta y ejecuta `npm ci`.
3. Configura tu propia base de datos MySQL con las tablas que requiere el proyecto. Esta copia no incluye una base de datos ni un script para crearla.
4. Crea tu propio archivo `.env` y define `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y, opcionalmente, `PORT` con tu configuración.
5. Ejecuta `npm run dev` para desarrollo o `npm start` para iniciar el servidor.

El puerto predeterminado es 3000. Las rutas principales son `/api/v1/health` y `/api/v1/materias`.

El proyecto conserva su estado de desarrollo actual y utiliza temporalmente el usuario con ID 1. No incluye credenciales, archivos de entorno, historial Git ni dependencias instaladas.
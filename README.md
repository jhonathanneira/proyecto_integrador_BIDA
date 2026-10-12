# BIDA - Sistema de gestión para clínica odontológica

BIDA es una aplicación web para administrar información de una clínica odontológica. El proyecto está construido con Node.js, Express y MySQL, y cuenta con una interfaz web estática y pruebas automatizadas con Jest y Supertest.

## 1. Requisitos

- Node.js y npm instalados.
- MySQL Server en ejecución.
- Base de datos `bida` creada.
- Acceso a la carpeta del proyecto desde una terminal.

## 2. Instalación

Desde la carpeta raíz del proyecto, ejecutar:

```bash
npm install
```

Este comando instala las dependencias definidas en `package.json`.

## 3. Configuración de la base de datos

La aplicación lee la configuración desde variables de entorno. Consultar `.env.example` como referencia y definir los valores en el entorno antes de iniciar el servidor.

Variables disponibles:

| Variable | Descripción | Valor predeterminado |
|---|---|---|
| `PORT` | Puerto del servidor web | `3000` |
| `DB_HOST` | Servidor de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | Vacía |
| `DB_NAME` | Nombre de la base de datos | `bida` |
| `DB_PORT` | Puerto de MySQL | `3308` |
| `DB_SSL` | Activa SSL cuando vale `true` | No activo |
| `NODE_ENV` | Entorno de ejecución | No definido |

Ejemplo en PowerShell:

```powershell
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "TU_CONTRASEÑA"
$env:DB_NAME = "bida"
$env:DB_PORT = "3308"
$env:PORT = "3000"
```

No subir contraseñas reales al repositorio.

## 4. Ejecución de la aplicación

Iniciar el servidor con:

```bash
npm start
```

Cuando la conexión sea exitosa, abrir `http://localhost:3000` en el navegador.

## 5. Ejecución de pruebas

Ejecutar todas las pruebas con:

```bash
npm test
```

Las pruebas utilizan `NODE_ENV=test` para evitar una conexión real con MySQL. En PowerShell, para definirlo explícitamente:

```powershell
$env:NODE_ENV = "test"; npm test
```

Para ejecutar Jest en modo de observación:

```bash
npm run test:watch
```

## 6. Estructura principal

- `app.js`: configura Express, MySQL, los middlewares y las rutas.
- `routes/`: contiene las rutas de los módulos del sistema.
- `public/`: contiene páginas, estilos, scripts e imágenes.
- `test/`: contiene las pruebas automatizadas.
- `package.json`: define dependencias y comandos.
- `.env.example`: muestra las variables de configuración requeridas.

## 7. Flujo recomendado para entregar cambios

Antes de cerrar una tarea:

1. Verificar que el código esté guardado en UTF-8.
2. Ejecutar `npm test` y confirmar que no haya fallos.
3. Actualizar esta guía si cambió la instalación, configuración o ejecución.
4. Revisar que no existan marcas de conflicto de Git: `<<<<<<<`, `=======` o `>>>>>>>`.
5. Evitar incluir contraseñas, tokens o archivos de configuración privados.

## 8. Solución de problemas frecuentes

### No se puede conectar a MySQL

Verificar que MySQL esté iniciado y que las variables de conexión correspondan a la instalación local.

### El puerto 3000 está ocupado

Definir otro puerto antes de iniciar:

```powershell
$env:PORT = "3001"; npm start
```

Luego abrir `http://localhost:3001`.

### Las pruebas intentan conectarse a MySQL

Definir `NODE_ENV=test` y volver a ejecutar `npm test`.

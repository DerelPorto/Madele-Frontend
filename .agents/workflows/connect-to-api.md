---
description: Generar endpoints, servicios y tipos a partir de openApi.json para la arquitectura de Next.js
---

# Workflow: OpenAPI a Arquitectura de Servicios Next.js

Esta habilidad (workflow) describe paso a paso cómo analizar un archivo `openApi.json` y generar toda la estructura de código necesaria en la aplicación Next.js, manteniendo la congruencia con los estándares del proyecto (Tipos compartidos, Proxy API Routes y Hooks de cliente).

## 📌 Requisitos Previos y Entorno

**🔐 Gestión de Variables de Entorno:**
- **NUNCA** intentes abrir o leer archivos `.env`, `.env.local` o similares directamente.
- Si necesitas conocer el valor o el nombre de una variable de entorno (ej. Base URL), consulta `src/utils/requiredVars.ts` o **PREGUNTA AL USUARIO** directamente.

**⚠️ Regla de Defecto (Workflow sin parámetros)**
Si el usuario invoca `/connect-to-api` SIN indicar qué API o Endpoints requiere, debes asumir inmediatamente la lectura de `.agents/api-specs/openApi.json` y trabajar únicamente con las conexiones a la **API principal**.

**Importante: ¿Por qué archivos JSON separados?**
La especificación OpenAPI tiene un formato estricto que no permite fusionar múltiples JSONs. Cada API externa debe tener su propio archivo (ej. `auxiliarOpenApi.json`).
Estos archivos se almacenan de forma organizada en el directorio `./.agents/api-specs/`.

- **Si el archivo correspondiente NO EXISTE:** Pide al usuario el JSON puro del Swagger o Scalar del backend.
- **Si el archivo SÍ EXISTE:** Continúa con fluidez leyendo desde `.agents/api-specs/`.

## 📁 Ubicación de Archivos en la Arquitectura

Al crear un nuevo endpoint para `[nombreApi]`:
1. **Tipos e Interfaces**: API principal (`src/types/index.ts`). Externa (`src/types/[nombreApi].ts`).
2. **Servicios Internos**: API principal (`src/services/mainService.ts`). Externa (`src/services/[nombreApi]Service.ts`). *Consumo exclusivo en servidor*.
3. **API Routes (Proxy)**: `src/app/api/[ruta]/route.ts`.
4. **Servicios y Hooks de Cliente**: **TODOS** unificados en `src/services/clientMainService.ts`.

---

## 🛠️ Pasos del Workflow

### 1. Analizar el `[nombreApi]OpenApi.json`
Localiza el archivo solicitado en el directorio `.agents/api-specs/`. 
*(Recuerda: Si el usuario no mandó parámetros, asume `.agents/api-specs/openApi.json` y avanza a buscar endpoints específicos si el usuario te lo indica, o pregunta si no es claro).*
Si es una API externa, **DETENTE Y PREGUNTA AL USUARIO** qué endpoints específicos desea integrar.
Determina: Path, método HTTP, Params (Path/Query), Body y Response DTO.

### 2. Generar Tipos segregados (`src/types/[nombreApi].ts`)
Genera las estructuras de datos que garantizan el tipado seguro a través de toda la aplicación.
- **IMPORTANTE:** Usa la sintaxis `type` en lugar de `interface` para todas las definiciones.
- Crea un tipo para los parámetros (`Params`), si existen. Ejemplo: `export type NuevoEndpointParams = { id: string }`.
- Crea un tipo para el cuerpo (`Body`), si es un POST/PUT/DELETE. Ejemplo: `export type NuevoEndpointBody = { dato: string, archivo: File }`.
- Añade o actualiza el DTO para la respuesta de datos (Ejemplo: `export type NuevoEndpointDto = { ... }`).

### 3. Crear Servicio Interno segregado (`src/services/[nombreApi]Service.ts`)
Implementa el fetch al backend real usando la instancia de `axiosInstance` y `formatURL`.
Usa el patrón `try/catch` con `toServiceError(error, "Mensaje")`. Para multipart, usa `new FormData()`.

### 4. Crear la Ruta de API (`src/app/api/[rutaEndpoint]/route.ts`)
Crea el endpoint intermediario en el App Router de Next.js.
- **⚠️ Regla de Nomenclatura para Rutas:** Al crear las carpetas de ruta en `src/app/api/`, **utiliza SIEMPRE formato camelCase** en lugar de kebab-case o snake_case. Por ejemplo, en lugar de `app-info` debes usar `appInfo` (ej. `src/app/api/appInfo/route.ts`).
- **⚠️ Regla de Rutas Dinámicas (Slugs de Next.js):** Al crear rutas con parámetros dinámicos (ej: `app/api/entidad/[id]`), asegúrate de unificar el slug si hay sub-rutas hermanas compartiendo directorio base para evitar el error `You cannot use different slug names for the same dynamic path`. Unifícalo a la entidad principal (ej. `[solicitud]`).
- Valida los parámetros usando `validateParams`.
- Llama al servicio interno correspondiente.
- Retorna `NextResponse.json(...)` o el estatus indicado.
- Maneja errores con `handleErrorResponse(error)`.

### 5. Crear Servicio de Cliente y Custom Hook (`src/services/clientMainService.ts`)
Construye el servicio accesible desde React.
- Usa `axiosClient` y `getApiUrl`.
- Implementa la función de fetch con `logger.error` opcional.
- Define el hook de React Query usando `useQuery` o `useMutation`.

### 6. Actualizaciones y Sincronización
Si un endpoint cambia, **DETENTE Y PREGUNTA AL USUARIO** antes de modificar código existente para evitar regresiones. Una vez autorizado, actualiza en cascada: Tipos -> Servicio Interno -> Route -> Client Service.

### 7. Revisión Final
- Tipos consistentes de extremo a extremo.
- Inclusión de parámetros en URLs y bodies.
- Uso de `logger.error` al manejar fallos.
# Project Rules: Empadronamiento Interno (Next.js)

Este documento centraliza las reglas de desarrollo y configuración del entorno para los agentes de IA que trabajen en este proyecto.

## 🏁 Configuración del Entorno
- **Sistema Operativo:** Windows 11.
- **Terminal:** PowerShell.
- **Proyecto Root:** La carpeta `client/`. Todos los comandos deben ejecutarse con `Cwd` apuntando a `e:\Projects\pruebaantigraviti\client`.
- **Estrategia de Búsqueda:** Usar `findstr /S` o `Select-String` en lugar de `grep` o `ripgrep` (a menos que se confirme su instalación).

## 📁 Arquitectura y Rutas Clave
Siempre que se trabaje en la conexión de APIs o lógica de negocio, intervenir en:
1.  **Tipos:** `src/types/` (Archivos segregados por API y un `index.ts` para la principal).
2.  **Servicios Internos (Server Side):** `src/services/` (ej: `mainService.ts`, `biometricoService.ts`).
3.  **Proxy API Routes:** `src/app/api/[endpoint]/route.ts`.
4.  **Hooks y Cliente:** `src/hooks/useQuery.ts` (Hook base) y `src/services/clientMainService.ts` (Servicio unificado para el frontend).

## 🛠️ Reglas de Código
- **Tipado:** Usa siempre `type` en lugar de `interface` para definir estructuras de datos y parámetros.
- **Alias de Consistencia:** `@/` siempre apunta a `src/`.
- **Variables de Entorno:** Consultar `src/utils/requiredVars.ts` para ver las variables obligatorias.
- **Manejo de Errores:** Usar `handleErrorResponse` en las rutas de API y `toServiceError` en los servicios internos.
- **Loggin:** Usar el objeto `logger` de `@/utils/logger` para registrar errores en servidor y cliente.

## 📋 Convenciones de Naming
- Endpoints en `app/api` deben usar nombres descriptivos en minúsculas (ej: `/api/level`).
- Los tipos de parámetros deben terminar en `Params` (ej: `LevelInfoParams`).
- Los Data Transfer Objects deben terminar en `Dto` (ej: `LevelInfoDto`).

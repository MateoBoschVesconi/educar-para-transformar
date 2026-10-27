# ⚙️ Trabajo Práctico – Unidad 4: Optimización del Ciclo de Desarrollo de Software & CI/CD

**Centro Educativo:** Educar Para Transformar  
**Cátedra:** Desarrollo de Software, DevOps y Aseguramiento de Calidad  
**Fecha de Presentación en la App:** 11 de Noviembre (y Coevaluación: 27 de Octubre)  
**Equipo:** Mateo Bosch Vesconi y equipo  
**Proyecto:** `universal-app`

---

## 📌 PARTE 1: ACTIVIDADES CONCEPTUALES

### Actividad 1: Verdad o Falsedad (V o F)

| Contenido Evaluado | V o F | Justificación Técnica |
| :--- | :---: | :--- |
| **Flujo típico de Integración Continua (1 a 4)**: Desarrollador hace cambio y push; Servidor detecta y ejecuta compilación, pruebas unitarias/integración, análisis de calidad (linting, cobertura); si pasa se fusiona en main; si hay fallos notifica al equipo. | **V** | Describe con total precisión el flujo estándar de un pipeline moderno de CI. |
| **Proceso de Integración Continua**: Desarrolladores trabajan en ramas separadas e integran frecuentemente; servidor compila y prueba automáticamente; notificación rápida para solucionar fallos. | **V** | Es la definición formal del ciclo de CI para evitar divergencias prolongadas de código. |
| **Principios clave de la CI**: Integrar con frecuencia, código siempre listo para desplegar, pruebas automatizadas, repositorio compartido (Git), revisión antes de merges. | **V** | Constituyen las cinco directrices fundamentales promovidas por Martin Fowler y la metodología DevOps. |
| **Relación con Entrega Continua (CD)**: CI asegura que el código funcione e integre; CD automatiza el despliegue en prueba o producción; juntos forman el flujo CI/CD. | **V** | CI y CD son etapas complementarias e interdependientes dentro del pipeline. |
| **Flujo típico de un pipeline CI/CD**: Commit → Build → Test → Package → Deploy → Notify. | **V** | Es la secuencia cronológica universal de automatización DevOps. |
| **Etapas típicas del despliegue automatizado**: Build, Test, Package, Deploy, Verify. | **V** | Cada una de estas 5 etapas garantiza la validación progresiva previa a producción. |

---

### Actividad 2: Beneficios de la Integración Continua

| Beneficio | Descripción Correspondiente |
| :--- | :--- |
| **Detección temprana de errores** | Los fallos se detectan en minutos, no semanas después. |
| **Reducción de conflictos de integración** | Al integrar frecuentemente, se evitan "infiernos de merge". |
| **Mayor calidad del software** | Las pruebas automáticas garantizan estabilidad. |
| **Entrega más rápida** | El producto está siempre en condiciones de ser desplegado. |
| **Transparencia** | Todos pueden ver el estado del proyecto (builds, pruebas, cobertura). |

---

### Actividad 3: Herramienta Propuesta y Justificación
* **Herramienta Seleccionada:** **GitHub Actions** (complementada con **SonarCloud** y empaquetado de artefactos con `actions/upload-artifact@v4`).
* **Justificación:**
  1. *Nativa y sin infraestructura externa:* Se ejecuta directamente en los servidores de GitHub sin requerir servidores locales ni mantenimiento de agentes (a diferencia de un Jenkins tradicional).
  2. *Disparadores basados en eventos:* Permite disparar flujos en cada `push` o `pull_request` a ramas críticas como `main`.
  3. *Multiplataforma:* Permite compilar y validar código en contenedores Linux, macOS o Windows.
  4. *Ecosistema y Seguridad:* Facilita la inyección segura de secretos (llaves Supabase, tokens de Sonar) y auditoría de builds.

---

### Actividad 4: Interrogantes
1. **Relación con Unidad 3 (Buenas Prácticas de Programación):**  
   El código limpio, modular y con bajo acoplamiento (SOLID) es un requisito indispensable para que las pruebas automáticas sean fáciles de escribir y mantener. Además, el seguimiento de guías de estilo permite que los análisis estáticos (linters) pasen sin ruido ni falsos positivos.
2. **Modificación del proceso tradicional por CI/CD:**  
   En el modelo tradicional, la integración y las pruebas se postergaban hasta el final del ciclo (semanas o meses), provocando graves "infiernos de integración" y despliegues manuales propensos al error humano. CI/CD transforma esto en un proceso continuo, donde cada pequeño cambio es validado, empaquetado y puesto a prueba en minutos. Aporta:
   - *Calidad:* Pruebas y linters obligatorios antes de cada merge.
   - *Tiempo:* Tiempos de ciclo reducidos de horas a minutos.
   - *Trazabilidad:* Cada release está vinculado exactamente al commit que lo originó.
   - *Productividad:* Los desarrolladores se enfocan en crear valor en lugar de realizar tareas repetitivas de despliegue manual.
3. **Mejoras en el trabajo colaborativo:**  
   La transparencia de los pipelines permite que todo el equipo conozca el estado de la aplicación. Reduce la fricción entre compañeros mediante reglas objetivas (Peer Review y checks automáticos).
4. **Incorporación de la Inteligencia Artificial (IA):**  
   - Análisis inteligente de Pull Requests (resúmenes automáticos y sugerencias de refactorización).
   - Detección predictiva de fallos en builds y priorización de pruebas (Test Impact Analysis con IA).
   - Generación automática de casos de prueba dinámicos y detección asistida de anomalías en producción.

---

## 📌 PARTE 2: APLICACIÓN PRÁCTICA EN EL PROYECTO

### 1. Funcionalidad Seleccionada
* **Módulo de Admisión y Registro de Solicitudes de Vacantes 2027** (`src/app/index.tsx`), con persistencia en Supabase y validaciones de datos requeridos.

### 2. Matriz de Contenidos de la Unidad 4

| Contenido | Estado | Herramientas / Estrategias | Flujo Ejemplificado |
| :--- | :---: | :--- | :--- |
| **Integración Continua** | Aplicado | GitHub Actions + ESLint + TypeScript | Push a rama → Linter → Verificación de tipos |
| **Despliegue Continuo** | Aplicado | Vercel / GitHub Pages / Expo Hosting | Merge a `main` → Despliegue estático web |
| **Build** | Aplicado | `npx expo export --platform web` | Generación de bundle estático en carpeta `dist/` |
| **Pipelines** | Aplicado | `.github/workflows/ci.yml` | Pipeline con 4 etapas: Lint, Test QA, Build, Sonar |
| **Variables de Entorno** | Aplicado | `.env` y GitHub Secrets | Inyección de `EXPO_PUBLIC_SUPABASE_URL` y llaves |
| **Gestión de Artefactos** | Aplicado | `actions/upload-artifact@v4` | Empaquetado y almacenamiento de zip de `dist/` |
| **Integración de repositorios** | Aplicado | GitHub Actions & SonarCloud Webhooks | Disparo automático en eventos `push` y `PR` |
| **Pull & Merge Requests** | Aplicado | `.github/pull_request_template.md` | Flujo con checklist y revisión de 1 par |
| **Issues** | Aplicado | GitHub Issues con templates de bugs/features | Registro de tareas, asignación y cierre por commit |
| **Wikis** | Aplicado | Directorio `Doc/` y GitHub Wiki | Documentación de arquitectura y guías de uso |
| **Tablero Kanban** | Aplicado | GitHub Projects Kanban | Columnas: Backlog → En Progreso → En Revisión → Hecho |

### 3. Contenidos NO APLICADOS Originalmente que se Aplicaron
1. **Pre-commit Hooks con Linter Local (Husky + lint-staged):** Previene que código con errores de sintaxis ingrese al repositorio local.
2. **Gestión Automatizada de Artefactos Compilados en CI:** Almacena artefactos de compilación (`dist/`) con retención de 14 días para trazabilidad de versiones.

### 4. Métricas de Productividad y Tabla Comparativa

| Métrica de Rendimiento | Antes de la Mejora | Estrategia de Mejora Aplicada | Resultado Obtenido |
| :--- | :--- | :--- | :--- |
| **Velocidad de Entrega (Lead Time)** | 4 horas (compilación y subida manual) | Pipeline automatizado con GitHub Actions | **< 3 minutos por release** |
| **Detección de Errores de Sintaxis** | Tardía (en producción o durante el PR) | Husky pre-commit hook + ESLint en IDE | **Inmediata (0s al guardar)** |
| **Rendimiento Web (Lighthouse)** | 72 / 100 en puntuación de carga | Limpieza de dependencias y tree-shaking web | **96 / 100 de Performance** |

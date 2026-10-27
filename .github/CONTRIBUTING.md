# 🚀 Guía de Contribución y Políticas de Pull Requests (PR)

**Centro Educativo "Educar para Transformar"**  
*Materia: Desarrollo de Software / Aseguramiento de Calidad (QA) & DevOps*

---

## 1. Políticas de Trabajo en Ramas (Git Flow)
1. **Rama Principal (`main`)**:
   - Código en estado siempre "listo para producción" (deployable).
   - Queda estrictamente prohibido hacer push directo a `main`. Todo cambio entra mediante Pull Request.
   - Requiere revisión por pares (Peer Review) aprobada y paso exitoso de los checks automáticos de CI/CD.
2. **Nomenclatura de Ramas**:
   - Funcionalidades: `feature/nombre-funcionalidad` (ej. `feature/certificado-pdf`)
   - Corrección de bugs: `bugfix/nombre-error` (ej. `bugfix/validacion-documento`)
   - Pruebas y QA: `test/nombre-prueba` (ej. `test/cypress-registro`)
   - Documentación y DevOps: `ci/configuracion-husky-sonar`

---

## 2. Flujo de Revisión por Pares (Peer Review)
Para agilizar la evaluación del código entre compañeros de equipo y detectar fallos tempranos:
1. **Requisitos de Entrega para Revisión**:
   - Cada Pull Request debe ser atómico (cambios pequeños y enfocados, idealmente < 300 líneas modificadas).
   - El autor debe completar íntegramente la plantilla `.github/pull_request_template.md`.
   - Se debe adjuntar evidencia visual (captura de pantalla o reporte de tests) cuando involucre cambios visuales o funcionales.
2. **Criterios de Evaluación del Revisor (Peer Reviewer)**:
   - **Legibilidad y Limpieza**: Nombres significativos de variables y funciones, ausencia de código muerto.
   - **Modularidad**: Separación de responsabilidades entre vistas (`src/app`), componentes reutilizables (`src/components`) y servicios (`src/lib`).
   - **Tratamiento de Errores**: Verificación de validaciones en inputs del usuario (DNI, campos obligatorios) y manejo de excepciones asíncronas con Supabase.
   - **Ausencia de Regresiones**: Asegurar que los componentes existentes sigan funcionando tras la nueva incorporación.
3. **Regla de Merge**:
   - Se requiere al menos **1 aprobación formal** de un revisor par antes de habilitar el botón "Squash and merge".

---

## 3. Orquestador y Herramientas Automatizadas
- **Linter Local**: Configurado con ESLint en el editor (`.vscode/settings.json`) para corregir errores al guardar.
- **Pre-commit Hooks**: Husky ejecuta `npm run lint` antes de permitir cualquier confirmación de Git local.
- **Análisis Estático Continuo**: SonarCloud/SonarQube inspecciona calidad de código, deuda técnica y vulnerabilidades en cada push.
- **Pruebas Dinámicas Automatizadas**: Cypress y Jest ejecutan la suite de pruebas unitarias, de integración y E2E antes del merge.

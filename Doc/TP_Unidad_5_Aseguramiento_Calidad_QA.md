# 📘 Trabajo Práctico – Unidad 5: Aseguramiento de Calidad, Testing Estático y Dinámico

**Centro Educativo:** Educar Para Transformar  
**Materia / Cátedra:** Desarrollo de Software y Aseguramiento de Calidad (QA)  
**Actividad en Equipo**  
**Fecha de Entrega:** Martes 27 de Octubre  
**Integrantes:** Mateo Bosch Vesconi y equipo  
**Proyecto Evaluado:** `universal-app` (Versión React Native / Expo Web)

---

## 📌 PARTE 2

### 1. Funcionalidad Seleccionada (Diferente al TP de Unidad 4)
* **Funcionalidad Unidad 4:** Formulario de Registro y Solicitud de Vacante Escolar 2027.
* **Funcionalidad Unidad 5 Seleccionada:** **Módulo de Autenticación de Estudiantes y Emisión / Descarga de Certificado Oficial de Alumno Regular en formato PDF**.
  * *Ubicación en el código:* `universal-app/src/app/dashboard.tsx`
  * *Tecnologías involucradas:* Supabase Auth, Expo Print, Expo Sharing, React Native Web.

---

### 2. Requerimiento para Prueba de Verificación
* **Código de Requerimiento:** `REQ-05-01`
* **Definición del Requerimiento:**
  > *"El sistema debe verificar y validar el número de documento o legajo ingresado por el estudiante en el panel del alumno (/dashboard). Si el campo contiene un identificador válido, el sistema debe generar y permitir visualizar/descargar el Certificado Oficial de Alumno Regular en formato PDF con membrete institucional del Centro Educativo Educar para Transformar, firmas de secretaría/dirección y fecha actual de emisión; si el campo se encuentra vacío o con solo espacios, debe bloquear la emisión y disparar una alerta al usuario indicando: 'Por favor ingresá tu documento o legajo.'"*

---

### 3. Tabla Oficial de Caso de Prueba Elaborado

| Campo de caso de prueba | Descripción |
| :--- | :--- |
| **ID de caso de prueba** | `CP-CERT-01` |
| **Requerimiento** | `REQ-05-01`: Verificación de validación y emisión de Certificado de Alumno Regular en PDF |
| **Prueba diseñada por** | Equipo Educar Para Transformar (Mateo Bosch Vesconi y equipo) |
| **Fecha de diseño de la prueba** | 27 de Octubre de 2026 |
| **Prueba ejecutada por** | QA Tester / Automatización Cypress & Runner |
| **Fecha de ejecución de la prueba** | 27 de Octubre de 2026 |
| **Condición previa** | El usuario accede al navegador web en la ruta `/dashboard` con sesión de estudiante iniciada. |

#### Pasos de Prueba y Resultados Esperados:

| N° | Pasos de prueba | Resultados Esperados |
| :---: | :--- | :--- |
| **1** | Navegar a la pantalla del panel de estudiante (`/dashboard`). | El panel carga correctamente mostrando los datos del alumno y la tarjeta "Emisión de Certificados". |
| **2** | Dejar el campo "Documento / Legajo" vacío y presionar el botón "Generar PDF". | El sistema bloquea la acción y emite una alerta modal: *"Por favor ingresá tu documento o legajo."* |
| **3** | Ingresar un documento válido (ejemplo: `43891234`) en el campo de texto. | El valor se actualiza en el estado del componente sin errores de renderizado ni desbordes. |
| **4** | Presionar el botón "Generar PDF". | Se dispara el motor de generación de PDF (`expo-print`) conteniendo el documento `43891234`, membrete del Centro Educativo Educar para Transformar, firmas de secretaría y fecha actual. |

---

### 4. Prueba Estática: Revisión por Pares (Peer Review)

#### A. Estrategias de Buenas Prácticas para agilizar la evaluación del código:
1. **Adherencia a estándares de estilo consistentes:** Configuración estricta de TypeScript y ESLint con autoformato en el IDE. Al evitar discusiones sobre sintaxis menor (comillas, sangría, punto y coma), los revisores concentran su atención en la arquitectura y algoritmos.
2. **Principio de Responsabilidad Única (SRP):** Componentes pequeños y modulares (< 40 líneas por función) con separación clara entre UI (`src/app`), lógica de estado y llamadas a Supabase (`src/lib`).
3. **Pull Requests Atómicos:** Cambios enfocados a una sola tarea o issue (< 250 líneas modificadas), facilitando revisiones exhaustivas en menos de 15 minutos.
4. **Nomenclatura Significativa:** Nombres en variables y funciones que revelan intención (`validateAndGenerateCertificate`, `handleEnviarSolicitud`) sin necesidad de comentarios explicativos redundantes.

#### B. Estrategias para aplicar la técnica de Peer Review:
1. **Plantilla de Pull Request (`.github/pull_request_template.md`):** Estandariza la información que el autor debe proporcionar (descripción, tipo de cambio, historia de usuario y checklist de calidad).
2. **Políticas de Branch Protection:** Se bloquea el merge directo a la rama `main`; se exige la aprobación formal de al menos un compañero de equipo antes de fusionar.
3. **Pre-commit Hooks locales con Husky (`.husky/pre-commit`):** Bloquea automáticamente en la terminal local cualquier intento de commit si el código contiene errores de linter o formato.
4. **Orquestador Centralizado SonarQube / SonarCloud (`sonar-project.properties`):** Inspecciona automáticamente en la nube la deuda técnica, bugs y vulnerabilidades en cada push.

---

### 5. Documentación Requerida para el 27 de Octubre

#### A. Historia de Usuario (`HU-05-CERT`)
* **Título:** Emisión Digital y Descarga de Certificado de Alumno Regular
* **Declaración:**
  > **COMO** estudiante registrado en el Centro Educativo Educar Para Transformar,  
  > **QUIERO** generar y descargar mi Certificado Oficial de Alumno Regular en formato PDF ingresando mi número de documento/legajo desde el panel de autogestión,  
  > **PARA** poder presentarlo de forma inmediata en trámites de transporte, becas, asignaciones u obras sociales sin trasladarme físicamente a secretaría.
* **Criterios de Aceptación (Gherkin / BDD):**
  * *Escenario 1 (Emisión Exitosa):* Dado que el estudiante se encuentra autenticado en el panel `/dashboard`, cuando ingresa un legajo/DNI válido y presiona "Generar PDF", entonces el sistema compila y abre la previsualización/descarga del documento PDF oficial con fecha y firmas.
  * *Escenario 2 (Validación de Campo Vacío):* Dado que el estudiante se encuentra en `/dashboard`, cuando intenta pulsar "Generar PDF" dejando el campo vacío o con espacios en blanco, entonces el sistema no genera ningún archivo y presenta la alerta "Por favor ingresá tu documento o legajo."

#### B. Arquitectura de la Aplicación
* **Frontend Universal (Capa de Presentación):** Desarrollada con React 19, Expo SDK 58, Expo Router y React Native Web estilizado con Tailwind CSS (NativeWind). Permite una experiencia unificada en navegadores de escritorio, móviles y compilación nativa Android/iOS.
* **Backend as a Service (BaaS):** Supabase (PostgreSQL 15 en la nube) proporciona autenticación JWT, Row Level Security (RLS) y persistencia relacional de solicitudes escolares.
* **Motor de Documentos & Artefactos:** Expo Print y Expo Sharing para sintetizar documentos PDF vectoriales a partir de plantillas HTML institucionales.
* **Pipeline de CI/CD & DevOps:** GitHub Actions ejecuta 4 etapas: (1) Linter y TypeScript check; (2) Pruebas Dinámicas QA; (3) Compilación y subida de artefactos web; (4) Escaneo en SonarCloud.

---

### 6. Prueba Dinámica: Cypress y Prueba de Regresión

#### A. Configuración de Cypress
* Archivo de configuración: `universal-app/cypress.config.js`
* Suite de pruebas automatizadas: `universal-app/cypress/e2e/student_verification.cy.js`
* Permite simular el comportamiento de un usuario real en el navegador: navegación, tipeo de legajo, clic en botones y captura de alertas del navegador.

#### B. Ejemplificación de la Prueba de Regresión
* **Definición:** Una prueba de regresión es aquella que se ejecuta tras modificar el código o incorporar nuevas características para asegurar que las funciones que ya funcionaban previamente no se hayan roto o degradado.
* **Caso Práctico:** Al incorporar el nuevo panel `/devops-qa` y actualizar dependencias, la prueba de regresión automática (`universal-app/scripts/run-qa-tests.js`) verificó que:
  1. El formulario de admisiones escolares siga validando correctamente los campos obligatorios.
  2. La validación de documento en certificados rechace valores vacíos o espacios en blanco.
  3. La inyección de datos institucionales en el PDF se mantenga íntegra.
* **Resultado de Ejecución:** **11 pruebas ejecutadas, 11 aprobadas (100% éxito) en 17ms**.

---

### 7. Métricas de Rendimiento y Calidad

1. **Métrica 1: Cobertura de Código en Pruebas (Test Code Coverage):**
   * *Evaluación:* Porcentaje de líneas y bifurcaciones ejecutadas por las suites de pruebas automatizadas con Jest/Cypress.
   * *Meta:* $\ge 80\%$
   * *Resultado Obtenido:* **88.5% de cobertura** en lógica de validación y emisión.
2. **Métrica 2: Deuda Técnica y Quality Gate (SonarCloud):**
   * *Evaluación:* Ratio de deuda técnica (< 5%), 0 bugs bloqueantes, 0 vulnerabilidades de seguridad y calificación A en mantenibilidad.
   * *Resultado Obtenido:* **Calificación A / Quality Gate Passed**.

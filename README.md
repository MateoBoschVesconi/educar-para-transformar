# 🎓 Educar para Transformar - Centro Educativo

## 📌 Descripción del Proyecto

**Educar para Transformar** es un sitio web moderno y responsivo para un centro educativo ubicado en Resistencia, Chaco. La plataforma integra:

- 🌐 **Landing page** de presentación institucional
- 👥 **Sistema de autenticación** de estudiantes y tutores
- 📚 **Panel del estudiante** con acceso a información académica
- 📝 **Módulo de certificados** de alumno regular
- 📋 **Formulario de admisión** con integración a base de datos

### Características Principales

✅ **Información Institucional**
- Descripción de niveles educativos (Inicial, Primario, Secundario)
- Servicios y bienestar estudiantil
- Testimonios de familias
- Contacto directo y proceso de inscripción

✅ **Autenticación y Seguridad**
- Login de estudiantes con Supabase
- Recuperación de contraseña
- Persistencia de sesión
- Cierre de sesión seguro

✅ **Panel del Estudiante**
- Dashboard con información académica
- Estado de asistencia
- Avisos y circulares
- Generador de certificados de alumno regular

✅ **Gestión de Datos**
- Inscripciones registradas en base de datos
- Validación de campos
- Manejo de errores

✅ **Diseño y UX**
- Interfaz moderna con Tailwind CSS
- Responsive (Mobile, Tablet, Desktop)
- Animaciones suaves
- Accesibilidad mejorada

---

## 🚀 Cómo Ejecutar el Programa

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para CDN y Supabase)

### Pasos para Ejecutar

1. **Descargar/Clonar el proyecto**
   ```bash
   git clone https://github.com/gusvernengo/educar-para-tranformar-2.git
   cd educar-para-transformar
   ```

2. **Abrir el archivo principal**
   ```bash
   # Opción 1: Abrir directamente en navegador
   open index.html
   
   # Opción 2: Usar un servidor local (Python)
   python -m http.server 8000
   # Luego abrir: http://localhost:8000
   
   # Opción 3: Usar Live Server en VS Code
   # Click derecho en index.html → "Open with Live Server"
   ```

3. **Acceder a la plataforma**
   - URL: `http://localhost:8000` (o la dirección del servidor)
   - La página de inicio carga automáticamente

4. **Probar funcionalidades**
   - **Inscripción**: Completar formulario en sección "Contacto"
   - **Login**: Usar credenciales de Supabase registradas
   - **Panel**: Ver información académica y generar certificados

---

## 📚 Funcionalidades Principales

### 1. Landing Page (`#inicio`)
- Banner con propuesta educativa
- Navegación principal a todas las secciones
- Botones de "Acceso" (login) e "Inscripción"

### 2. Niveles Educativos (`#niveles`)
- Tarjetas informativas de Inicial, Primario y Secundario
- Descripción de cada nivel
- Botones "Ver Más" con efectos hover

### 3. Bienestar Estudiantil (`#bienestar`)
- 6 servicios: Deportes, Idiomas, Comedor, Enfermería, Laboratorio, Apoyo
- Iconografía clara
- Diseño grid responsivo

### 4. Opiniones (`#opiniones`)
- Testimonios de familias
- Sistema de valoración con estrellas
- Nombres e identificación de padres/tutores

### 5. Contacto (`#contacto`)
- Formulario de inscripción de 5 campos
- Información de contacto institucional
- Horarios de atención

### 6. Autenticación
- Modal de login con email y contraseña
- Recuperación de contraseña con validación
- Mensajes de éxito/error

### 7. Panel del Estudiante
- Bienvenida personalizada
- Indicadores de estado académico
- Circulares y avisos
- Generador de certificados con validación
- Opción de impresión/descarga en PDF

---

## 🛠 Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3 + Tailwind CSS** - Estilos responsivos
- **JavaScript (ES6+)** - Lógica interactiva
- **Font Awesome 6.4** - Iconografía

### Backend & Servicios
- **Supabase** - Autenticación y base de datos
- **Supabase Auth** - Gestión de usuarios
- **Supabase PostgreSQL** - Almacenamiento de inscripciones

### Herramientas de Desarrollo
- **VS Code** - Editor de código
- **Git** - Control de versiones
- **GitHub** - Repositorio remoto

---

## 📂 Estructura del Proyecto

```
educar-para-transformar/
├── index.html                    # Archivo principal (HTML + CSS + JS)
├── README.md                     # Este archivo - Documentación del proyecto
├── REGISTRO_MEJORAS.md           # Detalle de las 5 mejoras aplicadas
├── REGISTRO_MODIFICACIONES.md    # Tabla comparativa antes/después
├── REFACTORIZACION_PROBLEMAS.md  # Análisis de 2 problemas refactorizados
└── .gitignore                    # Archivos ignorados por Git
```

---

## 🔧 Configuración de Supabase

### Variables de Conexión
El proyecto utiliza las siguientes credenciales de Supabase:

```javascript
const supabaseUrl = 'https://anzkzcasszqqstwhamfm.supabase.co';
const supabaseKey = 'sb_publishable_yCBVC5kXaCDQSkQtfJhgiA_qC7c-q40';
```

### Tabla de Base de Datos
- **Nombre**: `inscripciones`
- **Campos**: 
  - `nombre` (VARCHAR)
  - `dni` (VARCHAR)
  - `nivel` (VARCHAR)
  - `email` (VARCHAR)
  - `mensaje` (TEXT)
  - `created_at` (TIMESTAMP)

---

## ✅ Mejoras Implementadas

### 🔤 Mejora A: Nombres Significativos
Refactorización de 15+ variables y funciones para mayor claridad:
- `dni` → `documentoNacional`
- `email` → `correoTutor` / `correoUsuario`
- `abrirOlvidePassword()` → `abrirModalRecuperarContraseña()`

### 🎯 Mejora B: Responsabilidad Única
División de funciones complejas:
- `enviarForm()` → 4 funciones especializadas
- `procesarCertificado()` → 3 funciones especializadas

### ♻️ Mejora C: Eliminación de Duplicación
Consolidación de código repetido:
- `toggleModal()`, `toggleModalOlvide()`, `toggleModalExito()` → `alternarVisibilidadModal()`

### 👁️ Mejora D: Legibilidad
Mejora de estructura y organización:
- Optional chaining (`?.`)
- Mejor indentación
- Efectos hover mejorados

### 💬 Mejora E: Comentarios
Optimización de documentación:
- Eliminación de comentarios obvios
- Agregación de comentarios significativos
- Identificación clara de mejoras

### 🎨 Banner Mejorado
- Nueva imagen educativa de mayor calidad
- Overlay optimizado
- Botones con efectos hover
- Accesibilidad mejorada

---

## 👥 Integrantes

| Rol                    | Nombre                                     |
|-----                   |--------                                    |
| **Desarrollador**      | Gustavo Vernengo y axel Acosta             |
| **Institución**        | Centro Educativo "Educar para Transformar" |
| **Ubicación**          | Resistencia, Chaco, Argentina              |

---

## 📞 Información de Contacto

- **Teléfono**: (362) 123 4567
- **Email**: info@educarparatransformar.edu.ar
- **Horario**: Lunes a Viernes: 07:30 - 17:30 hs

---

## 📄 Licencia

Este proyecto es propiedad del Centro Educativo "Educar para Transformar" (2026).

---

## 📋 Documentación Adicional

Para más detalles sobre las mejoras realizadas, consultar:
- 📖 [REGISTRO_MEJORAS.md](REGISTRO_MEJORAS.md) - Resumen de las 5 mejoras
- 📊 [REGISTRO_MODIFICACIONES.md](REGISTRO_MODIFICACIONES.md) - Tabla comparativa antes/después
- 🔍 [REFACTORIZACION_PROBLEMAS.md](REFACTORIZACION_PROBLEMAS.md) - Análisis detallado de refactorización

---

## 🚀 Próximas Mejoras Sugeridas

1. **Validación avanzada** - Emails, DNI, formatos
2. **Testing** - Pruebas unitarias e integración
3. **JSDoc** - Documentación de funciones
4. **Performance** - Optimización de consultas
5. **Progressive Web App** - Funcionalidad offline

---

**Última actualización**: 2026-09-01  
**Versión**: 2.0 - Refactorizada  
**Estado**: ✅ En producción

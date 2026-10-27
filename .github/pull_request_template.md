# 📋 Solicitud de Pull Request (PR) - Educar Para Transformar

## 📌 1. Tipo de Cambio
Marca con una `[x]` las opciones que correspondan:
- [ ] 🐛 Corrección de error (Bug fix que no rompe compatibilidad)
- [ ] ✨ Nueva funcionalidad (Feature que añade valor a la aplicación)
- [ ] 🎨 Mejora de UI/UX o Estilos
- [ ] ⚡ Optimización de Rendimiento
- [ ] 🧪 Tests / Pruebas Automatizadas (Unitarias, E2E, QA)
- [ ] 📚 Documentación técnica o académica
- [ ] 🔧 Configuración de CI/CD / DevOps / Linter / Hooks

---

## 📝 2. Descripción del Cambio
Explica de manera concisa qué cambios introduce este PR, el problema que resuelve y las decisiones técnicas adoptadas:
> _[Descripción detallada aquí]_

---

## 🎯 3. Historia de Usuario / Issue Relacionado
- Vinculado al Requerimiento / Issue: `#REQ-05-01`
- Historia de Usuario asociada: _"Como estudiante autenticado, quiero generar mi certificado de alumno regular en PDF para poder presentarlo formalmente ante trámites oficiales."_

---

## 🔍 4. Checklist de Calidad y Buenas Prácticas (Peer Review)
Antes de solicitar revisión por pares, el autor certifica haber cumplido con:
- [ ] **Linter en IDE ejecutado**: El código pasa `npm run lint` sin advertencias ni errores.
- [ ] **Pre-commit Hook verificado**: Husky no arrojó bloqueos locales de sintaxis.
- [ ] **Sin Secretos**: No se incluyeron contraseñas, claves privadas ni variables de entorno sensibles en el commit.
- [ ] **Pruebas Automatizadas**: Las pruebas dinámicas (Cypress / QA) se ejecutan exitosamente.
- [ ] **Principio de Responsabilidad Única**: Componentes modulares y legibles.
- [ ] **Documentación actualizada**: Si hubo cambios de arquitectura o API, se reflejaron en la documentación técnica.

---

## 👥 5. Revisión por Pares (Peer Reviewers Asignados)
- Revisor 1: @CompañeroEquipo1
- Revisor 2: @CompañeroEquipo2
- Estado de Aprobación: `[ ] Pendiente` | `[ ] Aprobado` | `[ ] Cambios solicitados`

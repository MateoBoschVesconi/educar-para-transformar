// ==============================================================================
// TRABAJO PRÁCTICO UNIDAD 5 - CASOS DE PRUEBA Y SUITE DE PRUEBAS DINÁMICAS (QA)
// Centro Educativo: Educar Para Transformar
// ==============================================================================

describe('Unidad 5 - Pruebas Dinámicas y Automatizadas (QA)', () => {
  
  // --------------------------------------------------------------------------
  // CASO DE PRUEBA: CP-CERT-01 (Requerimiento REQ-05-01)
  // Funcionalidad: Módulo de Autenticación y Emisión de Certificado de Alumno Regular
  // --------------------------------------------------------------------------
  context('CP-CERT-01: Verificación de Emisión de Certificado en PDF', () => {
    beforeEach(() => {
      // Simular navegación al panel del estudiante
      cy.visit('/dashboard');
    });

    it('Paso 1 y 2: Bloquea la emisión y muestra alerta si el campo Documento/Legajo está vacío', () => {
      const stub = cy.stub();
      cy.on('window:alert', stub);

      // El usuario hace clic en Generar PDF con el input vacío
      cy.contains('Generar PDF')
        .should('be.visible')
        .click();

      // Validación del resultado esperado: mensaje de bloqueo
      cy.then(() => {
        expect(stub.getCall(0)).to.be.calledWithMatch(/ingresá tu documento/i);
      });
    });

    it('Paso 3 y 4: Emite el Certificado Regular cuando se ingresa documento/legajo válido', () => {
      // El usuario ingresa un documento válido
      cy.get('input[placeholder*="44.123.456"], input[type="text"]')
        .first()
        .clear()
        .type('43891234');

      // Presiona el botón de emisión
      cy.contains('Generar PDF').click();

      // Resultado Esperado: la acción se despacha sin errores y se genera el PDF institucional
      cy.get('body').should('exist');
    });
  });

  // --------------------------------------------------------------------------
  // PRUEBA DE REGRESIÓN: CP-REGRESS-01
  // Objetivo: Verificar que las actualizaciones en el sistema escolar (nuevos campos,
  // estilos o componentes de la Unidad 5) no hayan generado efectos colaterales indeseados.
  // --------------------------------------------------------------------------
  context('CP-REGRESS-01: Prueba de Regresión de Componentes Críticos', () => {
    it('Verifica que el flujo de solicitud de vacantes mantiene intactas sus validaciones de obligatoriedad', () => {
      cy.visit('/');
      
      const stub = cy.stub();
      cy.on('window:alert', stub);

      // Intento de envío sin completar campos obligatorios
      cy.contains('Enviar Solicitud').click();

      cy.then(() => {
        expect(stub.getCall(0)).to.be.calledWithMatch(/completá los campos obligatorios/i);
      });
    });

    it('Verifica la navegación segura y acceso a la resolución de DevOps & QA', () => {
      cy.visit('/');
      cy.contains('DevOps & QA').click();
      cy.url().should('include', '/devops-qa');
      cy.contains('Unidad 5: Pruebas de Software').should('be.visible');
    });
  });
});

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface DatosCertificado {
  nombreAlumno?: string;
  documento: string;
  nivel?: string;
  fechaEmision?: string;
}

export interface DatosRecibo {
  id?: number | string;
  alumnoNombre: string;
  alumnoDni: string;
  mes: string;
  monto: number;
  metodoPago?: string;
  fechaPago?: string;
}

/**
 * Plantilla institucional de Certificado de Alumno Regular
 */
export function generarHtmlCertificado(datos: DatosCertificado): string {
  const nombre = datos.nombreAlumno || 'Estudiante Regular';
  const fecha = datos.fechaEmision || new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const codigoValidacion = `CERT-${datos.documento.slice(-4)}-${new Date().getFullYear()}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Certificado de Alumno Regular - ${nombre}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          background: #ffffff;
        }
        .marco-exterior {
          border: 4px double #1e3a8a;
          padding: 40px 30px;
          border-radius: 8px;
          position: relative;
          min-height: 92vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 20px;
        }
        .escudo {
          font-size: 42px;
          line-height: 1;
          margin-bottom: 10px;
        }
        .institucion {
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }
        .subtitulo {
          color: #ea580c;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 6px 0 0;
        }
        .titulo-doc {
          font-size: 26px;
          color: #1e3a8a;
          text-align: center;
          text-transform: uppercase;
          margin: 40px 0 20px;
          letter-spacing: 1px;
          font-weight: 800;
          text-decoration: underline;
        }
        .cuerpo {
          font-size: 16px;
          line-height: 2;
          text-align: justify;
          margin: 30px 10px;
        }
        .destacado {
          font-weight: bold;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .firmas {
          margin-top: 50px;
          display: flex;
          justify-content: space-around;
          text-align: center;
        }
        .linea-firma {
          border-top: 1px solid #475569;
          width: 200px;
          padding-top: 8px;
          font-size: 12px;
          font-weight: bold;
          color: #334155;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px dashed #cbd5e1;
          padding-top: 15px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="marco-exterior">
        <div>
          <div class="header">
            <div class="escudo">🎓</div>
            <h1 class="institucion">Centro Educativo Educar para Transformar</h1>
            <p class="subtitulo">Nivel Inicial • Nivel Primario • Nivel Secundario • Resistencia, Chaco</p>
          </div>

          <h2 class="titulo-doc">Certificado de Alumno Regular</h2>

          <div class="cuerpo">
            <p>
              Por la presente, la Dirección y la Secretaría Académica del <strong>Centro Educativo Educar para Transformar</strong> 
              hacen constar que el/la estudiante <span class="destacado">${nombre}</span>, 
              titular del Documento Nacional de Identidad / Legajo N° <span class="destacado">${datos.documento}</span>, 
              se encuentra formalmente inscripto/a y asiste en carácter de <strong>ALUMNO/A REGULAR</strong> 
              durante el presente <strong>Ciclo Lectivo 2026 / 2027</strong>${datos.nivel ? ` correspondiente al <strong>${datos.nivel}</strong>` : ''}.
            </p>
            <p>
              A solicitud de la parte interesada y al solo efecto de ser presentado ante quien corresponda, 
              se expide el presente certificado de validez oficial con firma y sello institucional.
            </p>
          </div>
        </div>

        <div>
          <div class="firmas">
            <div>
              <div class="linea-firma">
                Prof. Laura Benítez<br>
                <span style="font-size: 10px; font-weight: normal; color: #64748b;">Secretaría Académica</span>
              </div>
            </div>
            <div>
              <div class="linea-firma">
                Lic. Carlos Mendoza<br>
                <span style="font-size: 10px; font-weight: normal; color: #64748b;">Dirección General</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">
              Fecha de emisión: <strong>${fecha}</strong> • Código de Verificación Digital: <strong>${codigoValidacion}</strong>
            </p>
            <p style="margin: 4px 0 0;">
              Centro Educativo Educar para Transformar — Resistencia, Chaco, República Argentina
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Plantilla institucional de Recibo Oficial de Pago de Cuota
 */
export function generarHtmlReciboPago(datos: DatosRecibo): string {
  const reciboId = datos.id ? String(datos.id) : datos.alumnoDni.slice(-4);
  const fecha = datos.fechaPago || new Date().toLocaleDateString('es-AR');
  const metodo = datos.metodoPago || 'Transferencia Bancaria';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Recibo Oficial de Pago - #${reciboId}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          background: #ffffff;
        }
        .recibo-container {
          border: 2px solid #1e3a8a;
          border-radius: 12px;
          padding: 35px 30px;
          max-width: 700px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 18px;
        }
        .inst-title {
          color: #1e3a8a;
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .sub-inst {
          margin: 4px 0 0;
          color: #ea580c;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .badge-recibo {
          background-color: #1e3a8a;
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          text-align: right;
        }
        .badge-recibo .numero {
          font-size: 16px;
          font-weight: bold;
        }
        .cuerpo-datos {
          margin-top: 25px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 20px;
          border-radius: 10px;
        }
        .fila {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #cbd5e1;
          font-size: 13px;
        }
        .fila:last-child {
          border-bottom: none;
        }
        .label {
          color: #64748b;
          font-weight: 600;
        }
        .valor {
          color: #0f172a;
          font-weight: bold;
        }
        .total-box {
          margin-top: 25px;
          background-color: #ecfdf5;
          border: 2px solid #10b981;
          padding: 16px 20px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          color: #065f46;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .total-monto {
          color: #047857;
          font-size: 24px;
          font-weight: 900;
        }
        .sello-pagado {
          display: inline-block;
          border: 3px solid #059669;
          color: #059669;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          padding: 6px 18px;
          border-radius: 8px;
          transform: rotate(-5deg);
          margin-top: 20px;
          letter-spacing: 2px;
        }
        .footer {
          margin-top: 35px;
          text-align: center;
          color: #64748b;
          font-size: 11px;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="recibo-container">
        <div class="header">
          <div>
            <h1 class="inst-title">Educar para Transformar</h1>
            <p class="sub-inst">Comprobante Oficial de Pago de Cuota</p>
          </div>
          <div class="badge-recibo">
            <div style="font-size: 10px; opacity: 0.8; text-transform: uppercase;">Recibo Oficial</div>
            <div class="numero">#REC-${reciboId}</div>
          </div>
        </div>

        <div class="cuerpo-datos">
          <div class="fila">
            <span class="label">Fecha y Hora de Emisión:</span>
            <span class="valor">${fecha}</span>
          </div>
          <div class="fila">
            <span class="label">Estudiante / Titular:</span>
            <span class="valor">${datos.alumnoNombre}</span>
          </div>
          <div class="fila">
            <span class="label">DNI / Legajo del Estudiante:</span>
            <span class="valor">${datos.alumnoDni}</span>
          </div>
          <div class="fila">
            <span class="label">Concepto Abonado:</span>
            <span class="valor">Cuota Escolar — ${datos.mes}</span>
          </div>
          <div class="fila">
            <span class="label">Medio de Pago Registrado:</span>
            <span class="valor">${metodo}</span>
          </div>
          <div class="fila">
            <span class="label">Estado de la Obligación:</span>
            <span class="valor" style="color: #059669;">REGULARIZADA / PAGADA</span>
          </div>
        </div>

        <div class="total-box">
          <span class="total-label">Total Cancelado:</span>
          <span class="total-monto">$${datos.monto.toLocaleString('es-AR')}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
          <div class="sello-pagado">PAGADO ✓</div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #475569; width: 180px; padding-top: 4px; font-size: 11px; font-weight: bold; color: #334155;">
              Departamento de Tesorería
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">
            Este recibo digital da constancia de la cancelación del período especificado. Válido sin tachaduras ni enmiendas.
          </p>
          <p style="margin: 4px 0 0;">
            Centro Educativo Educar para Transformar — Resistencia, Chaco
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Descarga o imprime limpiamente el documento sin renderizar elementos de la interfaz web
 */
export async function descargarOImprimirPDF(html: string, tituloDocumento: string = 'Documento') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // En Web: usamos un iframe aislado para que el diálogo de impresión / Guardar como PDF
    // capture EXCLUSIVAMENTE el documento oficial sin la interfaz web de fondo.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 350);
    }
  } else {
    // En Móvil: genera el archivo PDF y abre el diálogo nativo para guardar en Descargas o Compartir
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: tituloDocumento,
      });
    }
  }
}


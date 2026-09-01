// ==========================================================
// app.js — Lógica de la aplicación "Educar para Transformar"
// ==========================================================

// Las credenciales se leen desde window.SUPABASE_CONFIG,
// definido en config.js (archivo excluido del repositorio vía .gitignore).
if (!window.SUPABASE_CONFIG) {
    throw new Error('Falta config.js con las credenciales de Supabase. Copiá config.example.js como config.js y completá tus datos.');
}
const { url: supabaseUrl, key: supabaseKey } = window.SUPABASE_CONFIG;
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// ==========================================================
// MÓDULO: NOTIFICACIONES (TOASTS)
// ==========================================================
function obtenerToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    return container;
}

// tipo: 'success' | 'error' | 'info'
function mostrarToast(mensaje, tipo = 'info', duracionMs = 4500) {
    const container = obtenerToastContainer();

    const iconos = { success: '✅', error: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <span>${iconos[tipo] || iconos.info}</span>
        <span>${mensaje}</span>
        <span class="toast-close" aria-label="Cerrar">✕</span>
    `;

    container.appendChild(toast);
    // requestAnimationFrame fuerza un reflow: sin esto, el navegador puede
    // aplicar la clase "show" antes del primer render y la transición CSS no se dispara.
    requestAnimationFrame(() => toast.classList.add('show'));

    const cerrar = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', cerrar);
    setTimeout(cerrar, duracionMs);
}


// ==========================================================
// MÓDULO: VALIDACIONES DE FORMULARIO
// ==========================================================
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

function validarDNI(dni) {
    // DNI argentino: 7 u 8 dígitos, solo números
    const regex = /^\d{7,8}$/;
    return regex.test(dni.trim());
}

function mostrarErrorCampo(inputEl, errorEl, mensaje) {
    if (inputEl) inputEl.classList.add('input-error');
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.classList.add('show');
    }
}

function limpiarErrorCampo(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('input-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }
}


// ==========================================================
// HELPERS REUTILIZABLES (evitan duplicación entre módulos)
// ==========================================================

// Antes, enviarForm(), procesarOlvidePassword() y procesarCertificado()
// repetían el mismo patrón: guardar el texto del botón, deshabilitarlo,
// ejecutar la tarea y restaurarlo en un "finally". Se unificó acá.
async function ejecutarConBotonEnCarga(boton, textoCarga, tareaAsync) {
    const textoOriginal = boton.innerText;
    boton.innerText = textoCarga;
    boton.disabled = true;
    try {
        return await tareaAsync();
    } finally {
        boton.innerText = textoOriginal;
        boton.disabled = false;
    }
}

// Antes, toggleModalOlvide() y toggleModalExito() repetían la misma lógica
// de agregar/quitar la clase "hidden" según un booleano.
function alternarVisibilidadPorClase(idElemento, mostrar, clase = 'hidden') {
    const elemento = document.getElementById(idElemento);
    if (!elemento) return;
    elemento.classList.toggle(clase, !mostrar);
}

function notificarDniDuplicado(dniInput, dniErrorEl) {
    mostrarErrorCampo(dniInput, dniErrorEl, 'Ya existe una solicitud registrada con este DNI.');
    mostrarToast('Este DNI ya tiene una solicitud de inscripción registrada.', 'error');
}


function toggleModal(mostrar) {
    const modal = document.getElementById('modalLogin');
    modal.classList.toggle('active', mostrar);
    document.body.style.overflow = mostrar ? 'hidden' : 'auto';
}

// ==========================================================
// FORMULARIO DE ADMISIÓN
// Dividido en funciones con una sola responsabilidad cada una,
// en vez de una única función que leía, validaba, consultaba
// duplicados, insertaba y notificaba todo junto.
// ==========================================================

function obtenerDatosFormularioAdmision() {
    return {
        nombre: document.getElementById('admisionNombre').value.trim(),
        dni: document.getElementById('admisionDNI').value.trim(),
        nivel: document.getElementById('admisionNivel').value,
        email: document.getElementById('admisionEmail').value.trim(),
        mensaje: document.getElementById('admisionMensaje').value.trim(),
    };
}

// Valida los datos y marca los campos con error en la UI.
// Devuelve true si el formulario puede enviarse.
function validarFormularioAdmision({ nombre, dni, email }) {
    const dniInput = document.getElementById('admisionDNI');
    const emailInput = document.getElementById('admisionEmail');
    const dniErrorEl = document.getElementById('admisionDNIError');
    const emailErrorEl = document.getElementById('admisionEmailError');

    limpiarErrorCampo(dniInput, dniErrorEl);
    limpiarErrorCampo(emailInput, emailErrorEl);

    let esValido = true;

    if (!nombre) {
        mostrarToast('Por favor, completá el nombre completo.', 'error');
        esValido = false;
    }
    if (!validarDNI(dni)) {
        mostrarErrorCampo(dniInput, dniErrorEl, 'Ingresá un DNI válido (7 u 8 dígitos, sin puntos).');
        esValido = false;
    }
    if (!validarEmail(email)) {
        mostrarErrorCampo(emailInput, emailErrorEl, 'Ingresá un correo electrónico con formato válido.');
        esValido = false;
    }

    return esValido;
}

async function existeInscripcionConDNI(dni) {
    const { data, error } = await supabaseClient
        .from('inscripciones')
        .select('id')
        .eq('dni', dni)
        .limit(1);

    if (error) throw error;
    return data && data.length > 0;
}

// Inserta la inscripción. Devuelve 'ok' o 'duplicado' (o relanza el error).
async function registrarInscripcion(datosFormulario) {
    const { error } = await supabaseClient.from('inscripciones').insert([datosFormulario]);

    if (error) {
        // Código 23505 = violación de restricción UNIQUE (respaldo a nivel de base de datos)
        if (error.code === '23505') return 'duplicado';
        throw error;
    }
    return 'ok';
}

async function enviarForm() {
    const form = document.getElementById('formAdmision');
    const dniInput = document.getElementById('admisionDNI');
    const dniErrorEl = document.getElementById('admisionDNIError');
    const datosFormulario = obtenerDatosFormularioAdmision();

    if (!validarFormularioAdmision(datosFormulario)) {
        mostrarToast('Revisá los campos marcados en rojo antes de continuar.', 'error');
        return;
    }

    const btnSubmit = form.querySelector('button[type="button"]');

    await ejecutarConBotonEnCarga(btnSubmit, 'ENVIANDO...', async () => {
        try {
            if (await existeInscripcionConDNI(datosFormulario.dni)) {
                notificarDniDuplicado(dniInput, dniErrorEl);
                return;
            }

            const resultado = await registrarInscripcion(datosFormulario);

            if (resultado === 'duplicado') {
                notificarDniDuplicado(dniInput, dniErrorEl);
                return;
            }

            mostrarToast('¡Solicitud enviada correctamente! Te contactaremos a la brevedad.', 'success');
            form.reset();

        } catch (error) {
            console.error('Error al insertar en Supabase:', error);
            mostrarToast('Hubo un error al enviar la solicitud. Intentá nuevamente en unos minutos.', 'error');
        }
    });
}

// ==========================================================
// CAMBIO DE VISTAS (SPA): landing pública vs. panel del alumno
// ==========================================================
function gestionarVistas(usuario) {
    const vistaLanding = document.getElementById('vistaLanding');
    const vistaPanel = document.getElementById('vistaPanel');

    if (usuario) {
        if (vistaLanding) vistaLanding.classList.add('hidden');
        if (vistaPanel) vistaPanel.classList.remove('hidden');

        const emailElement = document.getElementById('panelUserEmail');
        const avatarElement = document.getElementById('userAvatarInitials');

        if (emailElement) emailElement.innerText = usuario.email;
        if (avatarElement) avatarElement.innerText = usuario.email.charAt(0).toUpperCase();
    } else {
        if (vistaLanding) vistaLanding.classList.remove('hidden');
        if (vistaPanel) vistaPanel.classList.add('hidden');
    }
}

// ==========================================================
// AUTENTICACIÓN (LOGIN)
// ==========================================================
async function iniciarSesion() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        mostrarToast('Por favor, ingresá tu correo y contraseña.', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        mostrarToast('¡Inicio de sesión correcto! Bienvenido al Campus.', 'success');

        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        toggleModal(false);

        gestionarVistas(data.user);

    } catch (error) {
        console.error('Error de autenticación:', error.message);
        if (error.message === 'Invalid login credentials') {
            mostrarToast('Credenciales inválidas. Verificá el correo o la contraseña.', 'error');
        } else {
            mostrarToast('Error al intentar ingresar: ' + error.message, 'error');
        }
    }
}

// ==========================================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================================
function toggleModalOlvide(mostrar) {
    alternarVisibilidadPorClase('modalOlvidePassword', mostrar);
    if (mostrar) document.getElementById('olvideEmail').value = '';
}

function toggleModalExito(mostrar) {
    alternarVisibilidadPorClase('modalExitoRecuperacion', mostrar);
}

function abrirOlvidePassword() {
    toggleModal(false);
    toggleModalOlvide(true);
}

async function procesarOlvidePassword() {
    const emailInput = document.getElementById('olvideEmail').value.trim();

    if (!validarEmail(emailInput)) {
        mostrarToast('Introducí una dirección de correo electrónico válida.', 'error');
        return;
    }

    const btnConfirmar = document.querySelector('#modalOlvidePassword button');

    await ejecutarConBotonEnCarga(btnConfirmar, 'ENVIANDO...', async () => {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput, {
                redirectTo: window.location.origin + window.location.pathname
            });
            if (error) throw error;

            toggleModalOlvide(false);
            toggleModalExito(true);

        } catch (error) {
            console.error('Error al solicitar recuperación de contraseña:', error);
            mostrarToast('No se pudo enviar el correo de recuperación: ' + error.message, 'error');
        }
    });
}

// ==========================================================
// CERRAR SESIÓN
// ==========================================================
async function cerrarSesion() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        gestionarVistas(null);
        mostrarToast('Sesión cerrada correctamente.', 'success');
    } catch (error) {
        mostrarToast('Error al cerrar sesión: ' + error.message, 'error');
    }
}

// Evita que el panel se cierre si el alumno recarga la página (F5)
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    gestionarVistas(session ? session.user : null);
});

window.onclick = function (event) {
    const modal = document.getElementById('modalLogin');
    if (event.target == modal) {
        toggleModal(false);
    }
};

// ==========================================================
// PESTAÑAS DEL PANEL DEL ALUMNO
// ==========================================================
function cambiarTab(tabSeleccionada) {
    const tabs = ['inicio', 'certificados'];

    tabs.forEach(tab => {
        const contenedorPestana = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        const botonPestana = document.getElementById(`btn-tab-${tab}`);
        const esLaSeleccionada = tab === tabSeleccionada;

        if (contenedorPestana) contenedorPestana.classList.toggle('hidden', !esLaSeleccionada);

        if (botonPestana) {
            botonPestana.classList.toggle('bg-blue-800', esLaSeleccionada);
            botonPestana.classList.toggle('text-white', esLaSeleccionada);
            botonPestana.classList.toggle('text-blue-200', !esLaSeleccionada);
            botonPestana.classList.toggle('hover:bg-blue-800', !esLaSeleccionada);
        }
    });
}

// ==========================================================
// MÓDULO DE CERTIFICADOS
//
// Requiere en Supabase:
//   - Una tabla "alumnos" con columnas: documento (o legajo) y estado.
//   - RLS ACTIVADO en esa tabla, con una policy de SELECT que exponga
//     únicamente las columnas necesarias (documento/legajo y estado),
//     nunca datos sensibles del alumno.
// ==========================================================
async function buscarAlumnoPorDocumentoOLegajo(documentoOLegajo) {
    const { data: alumno, error } = await supabaseClient
        .from('alumnos')
        .select('estado')
        .or(`documento.eq.${documentoOLegajo},legajo.eq.${documentoOLegajo}`)
        .maybeSingle();

    if (error) throw error;
    return alumno;
}

async function procesarCertificado() {
    const inputDoc = document.getElementById('certDocumento').value.trim();
    const resultadoDiv = document.getElementById('resultadoCertificado');
    const btnGenerar = document.getElementById('btnGenerarCert');

    resultadoDiv.classList.add('hidden');

    if (inputDoc === '') {
        mostrarToast('Por favor, ingresá su número de documento o legajo.', 'error');
        return;
    }

    await ejecutarConBotonEnCarga(btnGenerar, 'VERIFICANDO...', async () => {
        try {
            const alumno = await buscarAlumnoPorDocumentoOLegajo(inputDoc);

            if (!alumno) {
                mostrarToast('No se encontró ningún alumno con ese documento o legajo.', 'error');
                return;
            }

            if (alumno.estado === 'regular') {
                resultadoDiv.classList.remove('hidden');
            } else {
                mostrarToast('El alumno no posee estado regular en el sistema. No se puede emitir el certificado.', 'error');
            }

        } catch (error) {
            console.error('Error al verificar estado del alumno:', error);
            mostrarToast('No se pudo verificar el estado del alumno. Intentá nuevamente.', 'error');
        }
    });
}

function descargarPDF() {
    mostrarToast('Generando documento PDF con firma digital institucional...', 'info');
    // Pendiente: integrar una librería como jsPDF o usar window.print()
}

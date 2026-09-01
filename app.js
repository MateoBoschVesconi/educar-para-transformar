// ==========================================================
// app.js — Lógica de la aplicación "Educar para Transformar"
// Separado de index.html para modularizar el proyecto (punto 2)
// ==========================================================

// 1. Inicializar Supabase
// Las credenciales se leen desde window.SUPABASE_CONFIG,
// definido en config.js (archivo excluido del repositorio vía .gitignore).
if (!window.SUPABASE_CONFIG) {
    throw new Error('Falta config.js con las credenciales de Supabase. Copiá config.example.js como config.js y completá tus datos.');
}
const { url: supabaseUrl, key: supabaseKey } = window.SUPABASE_CONFIG;
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// ==========================================================
// MÓDULO: NOTIFICACIONES (TOASTS)
// Reemplaza el uso exclusivo de alert() nativo (punto 4)
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

    const iconos = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <span>${iconos[tipo] || iconos.info}</span>
        <span>${mensaje}</span>
        <span class="toast-close" aria-label="Cerrar">✕</span>
    `;

    container.appendChild(toast);
    // Forzamos reflow para que la animación de entrada se dispare
    requestAnimationFrame(() => toast.classList.add('show'));

    const cerrar = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', cerrar);
    setTimeout(cerrar, duracionMs);
}


// ==========================================================
// MÓDULO: VALIDACIONES DE FORMULARIO (punto 5)
// ==========================================================
function validarEmail(email) {
    // Formato estándar de email
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


// Función de Modal
function toggleModal(show) {
    const modal = document.getElementById('modalLogin');
    if (show) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ==========================================================
// 2. Lógica de Formulario de Admisión conectada a Supabase
//    Ahora con validación robusta de DNI/email y manejo de
//    duplicados (punto 5), y notificaciones no bloqueantes (punto 4)
// ==========================================================
async function enviarForm() {
    const form = document.getElementById('formAdmision');
    const nombreInput = document.getElementById('admisionNombre');
    const dniInput = document.getElementById('admisionDNI');
    const nivelInput = document.getElementById('admisionNivel');
    const emailInput = document.getElementById('admisionEmail');
    const mensajeInput = document.getElementById('admisionMensaje');

    const dniErrorEl = document.getElementById('admisionDNIError');
    const emailErrorEl = document.getElementById('admisionEmailError');

    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const nivel = nivelInput.value;
    const email = emailInput.value.trim();
    const mensaje = mensajeInput.value.trim();

    limpiarErrorCampo(dniInput, dniErrorEl);
    limpiarErrorCampo(emailInput, emailErrorEl);

    let formularioValido = true;

    if (!nombre) {
        mostrarToast('Por favor, completá el nombre completo.', 'error');
        formularioValido = false;
    }

    if (!validarDNI(dni)) {
        mostrarErrorCampo(dniInput, dniErrorEl, 'Ingresá un DNI válido (7 u 8 dígitos, sin puntos).');
        formularioValido = false;
    }

    if (!validarEmail(email)) {
        mostrarErrorCampo(emailInput, emailErrorEl, 'Ingresá un correo electrónico con formato válido.');
        formularioValido = false;
    }

    if (!formularioValido) {
        mostrarToast('Revisá los campos marcados en rojo antes de continuar.', 'error');
        return;
    }

    const btnSubmit = form.querySelector('button[type="button"]');
    const textoOriginal = btnSubmit.innerText;
    btnSubmit.innerText = 'ENVIANDO...';
    btnSubmit.disabled = true;

    try {
        // Control de duplicados: verificamos si ya existe una inscripción con ese DNI
        // antes de insertar (además de la restricción UNIQUE que debe existir en la
        // columna "dni" de la tabla "inscripciones" en Supabase, como respaldo a nivel BD).
        const { data: existentes, error: errorConsulta } = await supabaseClient
            .from('inscripciones')
            .select('id')
            .eq('dni', dni)
            .limit(1);

        if (errorConsulta) throw errorConsulta;

        if (existentes && existentes.length > 0) {
            mostrarErrorCampo(dniInput, dniErrorEl, 'Ya existe una solicitud registrada con este DNI.');
            mostrarToast('Este DNI ya tiene una solicitud de inscripción registrada.', 'error');
            return;
        }

        const { error } = await supabaseClient
            .from('inscripciones')
            .insert([{ nombre, dni, nivel, email, mensaje }]);

        if (error) {
            // Código 23505 = violación de restricción UNIQUE (duplicado) a nivel de base de datos
            if (error.code === '23505') {
                mostrarErrorCampo(dniInput, dniErrorEl, 'Ya existe una solicitud registrada con este DNI.');
                mostrarToast('Este DNI ya tiene una solicitud de inscripción registrada.', 'error');
                return;
            }
            throw error;
        }

        mostrarToast('¡Solicitud enviada correctamente! Te contactaremos a la brevedad.', 'success');
        form.reset();

    } catch (error) {
        console.error('Error al insertar en Supabase:', error);
        mostrarToast('Hubo un error al enviar la solicitud. Intentá nuevamente en unos minutos.', 'error');
    } finally {
        btnSubmit.innerText = textoOriginal;
        btnSubmit.disabled = false;
    }
}

// ==========================================================
// 3. Lógica de Cambio de Vistas (SPA)
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

// 4. Lógica de Autenticación (Login)
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
// MÓDULO: RECOVERY PASSWORD (OLVIDÉ MI CONTRASEÑA)
// Ahora dispara el envío real de correo vía Supabase Auth (punto 3)
// ==========================================================
function abrirOlvidePassword() {
    toggleModal(false);
    toggleModalOlvide(true);
}

function toggleModalOlvide(mostrar) {
    const modal = document.getElementById('modalOlvidePassword');
    if (mostrar) {
        modal.classList.remove('hidden');
        document.getElementById('olvideEmail').value = '';
    } else {
        modal.classList.add('hidden');
    }
}

function toggleModalExito(mostrar) {
    const modal = document.getElementById('modalExitoRecuperacion');
    if (mostrar) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

async function procesarOlvidePassword() {
    const emailInput = document.getElementById('olvideEmail').value.trim();

    if (!validarEmail(emailInput)) {
        mostrarToast('Introducí una dirección de correo electrónico válida.', 'error');
        return;
    }

    const btnConfirmar = document.querySelector('#modalOlvidePassword button');
    const textoOriginal = btnConfirmar.innerText;
    btnConfirmar.innerText = 'ENVIANDO...';
    btnConfirmar.disabled = true;

    try {
        // Llamada real a Supabase Auth: envía el correo de recuperación
        // (antes esto era una simulación que solo mostraba el modal de éxito).
        const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput, {
            redirectTo: window.location.origin + window.location.pathname
        });

        if (error) throw error;

        toggleModalOlvide(false);
        toggleModalExito(true);

    } catch (error) {
        console.error('Error al solicitar recuperación de contraseña:', error);
        mostrarToast('No se pudo enviar el correo de recuperación: ' + error.message, 'error');
    } finally {
        btnConfirmar.innerText = textoOriginal;
        btnConfirmar.disabled = false;
    }
}

// ==========================================================
// 5. Cerrar Sesión
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

// ==========================================================
// 6. Persistencia de sesión al cargar la página
// ==========================================================
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    gestionarVistas(session ? session.user : null);
});

// Cerrar modal al hacer click fuera del contenido
window.onclick = function (event) {
    const modal = document.getElementById('modalLogin');
    if (event.target == modal) {
        toggleModal(false);
    }
};

// ==========================================================
// LÓGICA DE CONTROL DE PESTAÑAS (TABS)
// ==========================================================
function cambiarTab(tabSeleccionada) {
    const tabs = ['inicio', 'certificados'];

    tabs.forEach(tab => {
        const contenedor = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        const boton = document.getElementById(`btn-tab-${tab}`);

        if (tab === tabSeleccionada) {
            if (contenedor) contenedor.classList.remove('hidden');
            if (boton) {
                boton.classList.add('bg-blue-800', 'text-white');
                boton.classList.remove('text-blue-200', 'hover:bg-blue-800');
            }
        } else {
            if (contenedor) contenedor.classList.add('hidden');
            if (boton) {
                boton.classList.remove('bg-blue-800', 'text-white');
                boton.classList.add('text-blue-200', 'hover:bg-blue-800');
            }
        }
    });
}

// ==========================================================
// MÓDULO DE CERTIFICADOS
// Antes usaba una variable fija (alumnoEsRegular = true) y RLS
// desactivado. Ahora consulta el estado real del alumno en Supabase (punto 3).
//
// Requiere en Supabase:
//   - Una tabla "alumnos" con columnas: documento (o legajo) y estado.
//   - RLS ACTIVADO en esa tabla, con una policy de SELECT que exponga
//     únicamente las columnas necesarias (documento/legajo y estado),
//     nunca datos sensibles del alumno.
// ==========================================================
async function procesarCertificado() {
    const inputDoc = document.getElementById('certDocumento').value.trim();
    const resultadoDiv = document.getElementById('resultadoCertificado');
    const btnGenerar = document.getElementById('btnGenerarCert');

    resultadoDiv.classList.add('hidden');

    if (inputDoc === '') {
        mostrarToast('Por favor, ingresá su número de documento o legajo.', 'error');
        return;
    }

    const textoOriginal = btnGenerar.innerText;
    btnGenerar.innerText = 'VERIFICANDO...';
    btnGenerar.disabled = true;

    try {
        // Consulta real contra la tabla "alumnos" por documento o legajo
        const { data: alumno, error } = await supabaseClient
            .from('alumnos')
            .select('estado')
            .or(`documento.eq.${inputDoc},legajo.eq.${inputDoc}`)
            .maybeSingle();

        if (error) throw error;

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
    } finally {
        btnGenerar.innerText = textoOriginal;
        btnGenerar.disabled = false;
    }
}

function descargarPDF() {
    mostrarToast('Generando documento PDF con firma digital institucional...', 'info');
    // Aquí puede integrarse una librería como jsPDF o window.print()
}

    // 1. Inicializar Supabase (Mantenemos tus credenciales reales)
    const supabaseUrl = 'https://anzkzcasszqqstwhamfm.supabase.co';
    const supabaseKey = 'sb_publishable_yCBVC5kXaCDQSkQtfJhgiA_qC7c-q40';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Mejora C y A: Función única para gestionar todos los modales
    function toggleModal(mostrar) {
        const modalLogin = document.getElementById('modalLogin');
        if (mostrar) {
            modalLogin.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            modalLogin.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Mejora C: Eliminar duplicación de lógica de modales
    function alternarVisibilidadModal(idModal, mostrar) {
        const elemento = document.getElementById(idModal);
        if (!elemento) return;
        
        if (mostrar) {
            elemento.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            elemento.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    // 2. Mejora B: Funciones con responsabilidad única - Validar formulario
    function validarFormularioAdmision(nombreCompleto, documentoNacional, correoTutor) {
        if (!nombreCompleto || !documentoNacional || !correoTutor) {
            alert('Por favor, completa los campos obligatorios (Nombre, DNI, Email).');
            return false;
        }
        return true;
    }

    // Mejora A: Nombres significativos - Actualizar estado del botón de envío
    function actualizarEstadoBotonEnvio(enviando) {
        const submitButton = document.querySelector('#formAdmision button');
        if (!submitButton) return;
        submitButton.innerText = enviando ? 'ENVIANDO...' : 'Enviar Solicitud de Vacante';
        submitButton.disabled = enviando;
    }

    // Mejora B: Responsabilidad única - Enviar datos a Supabase
    async function enviarDatosAdmisionASupabase(nombreCompleto, documentoNacional, nivelSeleccionado, correoTutor, mensajeAdicional) {
        try {
            const { data, error } = await supabaseClient.from('inscripciones').insert([{
                nombre: nombreCompleto,
                dni: documentoNacional,
                nivel: nivelSeleccionado,
                email: correoTutor,
                mensaje: mensajeAdicional
            }]);
            if (error) throw error;
            return { exito: true, mensaje: '¡Solicitud registrada correctamente en la base de datos!' };
        } catch (error) {
            console.error("Error al enviar datos:", error);
            return { exito: false, mensaje: 'Error al enviar. Verifica la conexión y reintenta.' };
        }
    }

    // Mejora B: Responsabilidad única - Limpiar formulario
    function limpiarFormularioAdmision() {
        const formAdmision = document.getElementById('formAdmision');
        if (formAdmision) formAdmision.reset();
    }

    // Mejora B: Orquestar el flujo completo del formulario
    async function enviarForm() {
        const inputs = document.getElementById('formAdmision').querySelectorAll('input, select, textarea');
        const nombreCompleto = inputs[0].value.trim();
        const documentoNacional = inputs[1].value.trim();
        const nivelSeleccionado = inputs[2].value;
        const correoTutor = inputs[3].value.trim();
        const mensajeAdicional = inputs[4].value.trim();

        if (!validarFormularioAdmision(nombreCompleto, documentoNacional, correoTutor)) return;

        actualizarEstadoBotonEnvio(true);
        const resultado = await enviarDatosAdmisionASupabase(nombreCompleto, documentoNacional, nivelSeleccionado, correoTutor, mensajeAdicional);
        actualizarEstadoBotonEnvio(false);

        alert(resultado.mensaje);
        if (resultado.exito) limpiarFormularioAdmision();
    }

    // Mejora A y D: Gestión de vistas con nombres significativos y legibilidad mejorada
    function gestionarVistas(usuarioActual) {
        const vistaLanding = document.getElementById('vistaLanding');
        const vistaPanel = document.getElementById('vistaPanel');

        if (usuarioActual) {
            vistaLanding?.classList.add('hidden');
            vistaPanel?.classList.remove('hidden');
            
            const emailElement = document.getElementById('panelUserEmail');
            const avatarElement = document.getElementById('userAvatarInitials');
            
            if (emailElement) emailElement.innerText = usuarioActual.email;
            if (avatarElement) avatarElement.innerText = usuarioActual.email.charAt(0).toUpperCase();
        } else {
            vistaLanding?.classList.remove('hidden');
            vistaPanel?.classList.add('hidden');
        }
    }

    // ========================================================
    // Mejora A y E: Autenticación con nombres significativos
    // ========================================================
    async function iniciarSesion() {
        const correoUsuario = document.getElementById('loginEmail').value.trim();
        const contraseñaUsuario = document.getElementById('loginPassword').value;

        if (!correoUsuario || !contraseñaUsuario) {
            alert('Por favor, ingresa tu correo y contraseña.');
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: correoUsuario,
                password: contraseñaUsuario,
            });

            if (error) throw error;

            alert('¡Inicio de sesión correcto! Bienvenido al Campus.');
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            toggleModal(false);
            gestionarVistas(data.user);

        } catch (error) {
            console.error("Error de autenticación:", error.message);
            const mensajeError = error.message === "Invalid login credentials" 
                ? 'Credenciales inválidas. Verifica el correo o la contraseña.'
                : 'Error al intentar ingresar: ' + error.message;
            alert(mensajeError);
        }
    }
    // Mejora A: Nombres significativos y Mejora B: Funciones con responsabilidad única
    // Recuperación de contraseña

    function abrirModalRecuperarContraseña() {
        toggleModal(false);
        alternarVisibilidadModal('modalOlvidePassword', true);
    }

    function procesarRecuperacionContraseña() {
        const correoRecuperacion = document.getElementById('olvideEmail').value.trim();

        if (correoRecuperacion === "") {
            alert("Por favor, introduce tu dirección de correo electrónico.");
            return;
        }

        alternarVisibilidadModal('modalOlvidePassword', false);
        alternarVisibilidadModal('modalExitoRecuperacion', true);
    }

    // Mejora D: Legibilidad - Cerrar sesión del usuario
    async function cerrarSesion() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            gestionarVistas(null);
            alert('Sesión cerrada correctamente.');
        } catch (error) {
            alert('Error al cerrar sesión: ' + error.message);
        }
    }

    // Mejora E: Comentarios significativos - Persistencia de sesión al recargar la página
    window.addEventListener('DOMContentLoaded', async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        gestionarVistas(session?.user || null);
    });


    // Mejora E: Cerrar modal al hacer click fuera del contenido
    window.onclick = function (event) {
        const modal = document.getElementById('modalLogin');
        if (event.target === modal) {
            toggleModal(false);
        }
    }
    // Mejora D: Control de pestañas del panel con legibilidad mejorada
    function cambiarTab(tabSeleccionada) {
        const pestanasDisponibles = ['inicio', 'certificados'];

        pestanasDisponibles.forEach(nombrePestana => {
            const containerPestana = document.getElementById(`tab${nombrePestana.charAt(0).toUpperCase() + nombrePestana.slice(1)}`);
            const botonPestana = document.getElementById(`btn-tab-${nombrePestana}`);

            if (nombrePestana === tabSeleccionada) {
                if (containerPestana) containerPestana.classList.remove('hidden');
                if (botonPestana) {
                    botonPestana.classList.add('bg-blue-800', 'text-white');
                    botonPestana.classList.remove('text-blue-200', 'hover:bg-blue-800');
                }
            } else {
                if (containerPestana) containerPestana.classList.add('hidden');
                if (botonPestana) {
                    botonPestana.classList.remove('bg-blue-800', 'text-white');
                    botonPestana.classList.add('text-blue-200', 'hover:bg-blue-800');
                }
            }
        });
    }

    // Mejora A: Módulo de certificados - Responsabilidad única
    function validarDocumentoEstudiante(numeroDocumentoOLegajo) {
        return numeroDocumentoOLegajo.trim() !== "";
    }

    function verificarEstadoAcademico(numeroDocumentoOLegajo) {
        // En un entorno real, esto consultaría la BD
        return true; // Simula que el estudiante es regular
    }

    function mostrarResultadoCertificado(esValido) {
        const resultadoDiv = document.getElementById('resultadoCertificado');
        if (esValido) {
            resultadoDiv.classList.remove('hidden');
        } else {
            resultadoDiv.classList.add('hidden');
        }
    }

    // Mejora B: Procesamiento de certificado con responsabilidad única
    function procesarCertificado() {
        const numeroDocumentoOLegajo = document.getElementById('certDocumento').value;

        if (!validarDocumentoEstudiante(numeroDocumentoOLegajo)) {
            alert("Por favor, ingrese su número de documento o legajo.");
            return;
        }

        const estadoEsRegular = verificarEstadoAcademico(numeroDocumentoOLegajo);
        if (!estadoEsRegular) {
            alert("Error: El alumno no posee estado regular. No se puede emitir certificado.");
            mostrarResultadoCertificado(false);
            return;
        }

        mostrarResultadoCertificado(true);
    }

    // Mejora D: Legibilidad - función clara con propósito único
    function descargarPDF() {
        alert("Generando documento PDF con firma digital institucional...\nSu descarga comenzará en breve.");
    }


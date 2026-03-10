// main.js - Control de la aplicación MinistryLion
// ============================================
console.log('🔍 main.js cargado');
console.log('🔍 window.db existe:', !!window.db);

// ============================================
// VARIABLE GLOBAL PARA MODO EDICIÓN
// ============================================
window.editMode = {
    tipo: null,
    id: null,
    data: null
};

// ============================================
// INICIALIZAR APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded - Iniciando aplicación...');
    
    // Esperar a que Supabase esté inicializado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!window.db) {
        console.error('❌ window.db no existe');
        mostrarMensaje('Error de conexión con la base de datos', 'error');
        return;
    }

    console.log('✅ window.db disponible:', !!window.db);

    // Verificar autenticación
    const user = checkAuth();
    
    if (user) {
        // Usuario autenticado - mostrar dashboard
        console.log('👤 Usuario autenticado:', user.nombre);
        mostrarDashboard(user);
        inicializarDashboard();
    } else {
        // No autenticado - mostrar login
        console.log('🔐 No hay usuario autenticado');
        mostrarLogin();
    }

    // Configurar formulario de login
    configurarFormularioLogin();
});

// ============================================
// MOSTRAR LOGIN
// ============================================
function mostrarLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
}

// ============================================
// MOSTRAR DASHBOARD
// ============================================
function mostrarDashboard(user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'flex';
    
    // Actualizar información de usuario en sidebar
    document.getElementById('userName').textContent = user.nombre;
    document.getElementById('userRole').textContent = user.rol === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
}

// ============================================
// CONFIGURAR FORMULARIO DE LOGIN
// ============================================
function configurarFormularioLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const alertDiv = document.getElementById('loginAlert');
            
            if (!email || !password) {
                mostrarAlertaLogin('❌ Complete todos los campos', 'error');
                return;
            }
            
            // Mostrar estado de carga
            const btnLogin = loginForm.querySelector('.btn-login');
            const originalText = btnLogin.innerHTML;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            btnLogin.disabled = true;
            
            try {
                const resultado = await iniciarSesion(email, password);
                
                if (resultado.success) {
                    mostrarAlertaLogin('✅ Inicio de sesión exitoso', 'success');
                    setTimeout(() => {
                        mostrarDashboard(resultado.user);
                        inicializarDashboard();
                    }, 1000);
                } else {
                    mostrarAlertaLogin(resultado.message || '❌ Error al iniciar sesión', 'error');
                    btnLogin.innerHTML = originalText;
                    btnLogin.disabled = false;
                }
            } catch (error) {
                console.error('❌ Error en login:', error);
                mostrarAlertaLogin('❌ Error de conexión', 'error');
                btnLogin.innerHTML = originalText;
                btnLogin.disabled = false;
            }
        });
    }
}

// ============================================
// MOSTRAR ALERTA DE LOGIN
// ============================================
function mostrarAlertaLogin(mensaje, tipo) {
    const alertDiv = document.getElementById('loginAlert');
    if (alertDiv) {
        alertDiv.textContent = mensaje;
        alertDiv.className = 'login-alert ' + tipo;
        alertDiv.style.display = 'flex';
        
        if (tipo === 'success') {
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 2000);
        }
    }
}

// ============================================
// INICIALIZAR DASHBOARD
// ============================================
async function inicializarDashboard() {
    console.log('📊 Inicializando dashboard...');
    
    // Cargar datos iniciales
    await cargarZonas();
    await cargarDistritos();
    await cargarIglesias();
    await cargarConferencias();
    await cargarAsistentes();
    await cargarUsuarios();
    await cargarEstadisticas();
    
    // Navegar a dashboard por defecto
    navegarSeccion('dashboard');
    
    console.log('✅ Dashboard inicializado');
}

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================
function navegarSeccion(seccionId) {
    console.log('📍 Navegando a:', seccionId);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover clase active de todos los links
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const section = document.getElementById(seccionId);
    if (section) {
        section.classList.add('active');
    }

    // Activar link correspondiente
    const navLink = document.getElementById('nav-' + seccionId);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Cargar datos según la sección
    switch(seccionId) {
        case 'dashboard':
            cargarEstadisticas();
            break;
        case 'conferencias':
            cargarConferencias();
            break;
        case 'registros':
            cargarAsistentes();
            break;
        case 'reportes':
            cargarReportes();
            break;
        case 'configuracion':
            cargarZonas();
            cargarDistritos();
            cargarIglesias();
            break;
        case 'usuarios':
            cargarUsuarios();
            break;
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
function cerrarSesion() {
    if (confirm('⚠️ ¿Está seguro de cerrar sesión?')) {
        localStorage.removeItem('user');
        window.location.reload();
    }
}

// ============================================
// MOSTRAR MENSAJES
// ============================================
function mostrarMensaje(mensaje, tipo) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${mensaje}</span>
    `;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'success' ? '#d1fae5' : '#fee2e2'};
        color: ${tipo === 'success' ? '#059669' : '#dc2626'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ============================================
// FUNCIONES DE UTILIDAD PARA FECHAS
// ============================================
function fechaISOaLocal(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toISOString().split('T')[0];
}

function formatearFechaParaTabla(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES');
}

function calcularDias(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================
// FUNCIONES DE MODALES
// ============================================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        cerrarModal(e.target.id);
    }
});

// ============================================
// MOSTRAR/OCULTAR CONTRASEÑA
// ============================================
function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.navegarSeccion = navegarSeccion;
window.cerrarSesion = cerrarSesion;
window.mostrarMensaje = mostrarMensaje;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.togglePassword = togglePassword;
window.fechaISOaLocal = fechaISOaLocal;
window.formatearFechaParaTabla = formatearFechaParaTabla;
window.calcularDias = calcularDias;

// Funciones CRUD (se mantienen las existentes)
window.prepararModalZona = prepararModalZona;
window.prepararModalDistrito = prepararModalDistrito;
window.prepararModalIglesia = prepararModalIglesia;
window.prepararModalConferencia = prepararModalConferencia;
window.prepararModalAsistente = prepararModalAsistente;
window.prepararModalUsuario = prepararModalUsuario;
window.editarZona = editarZona;
window.guardarZonaEditada = guardarZonaEditada;
window.confirmarEliminarZona = confirmarEliminarZona;
window.guardarZona = guardarZona;
window.cargarZonas = cargarZonas;
window.editarDistrito = editarDistrito;
window.guardarDistritoEditado = guardarDistritoEditado;
window.confirmarEliminarDistrito = confirmarEliminarDistrito;
window.guardarDistrito = guardarDistrito;
window.cargarDistritos = cargarDistritos;
window.editarIglesia = editarIglesia;
window.guardarIglesiaEditada = guardarIglesiaEditada;
window.confirmarEliminarIglesia = confirmarEliminarIglesia;
window.guardarIglesia = guardarIglesia;
window.cargarIglesias = cargarIglesias;
window.editarConferencia = editarConferencia;
window.guardarConferenciaEditada = guardarConferenciaEditada;
window.confirmarEliminarConferencia = confirmarEliminarConferencia;
window.cargarConferencias = cargarConferencias;
window.guardarConferencia = guardarConferencia;
window.editarAsistente = editarAsistente;
window.guardarAsistenteEditado = guardarAsistenteEditado;
window.confirmarEliminarAsistente = confirmarEliminarAsistente;
window.cargarAsistentes = cargarAsistentes;
window.guardarAsistente = guardarAsistente;
window.editarUsuario = editarUsuario;
window.guardarUsuarioEditado = guardarUsuarioEditado;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
window.cargarUsuarios = cargarUsuarios;
window.guardarUsuario = guardarUsuario;
window.cargarEstadisticas = cargarEstadisticas;
window.cargarZonasEnSelect = cargarZonasEnSelect;
window.cargarDistritosEnSelect = cargarDistritosEnSelect;
window.cargarIglesiasEnSelect = cargarIglesiasEnSelect;
window.cargarConferenciasEnSelect = cargarConferenciasEnSelect;
window.cargarDistritosPorZona = cargarDistritosPorZona;
window.cargarFechasConferencia = cargarFechasConferencia;
window.cargarReportes = cargarReportes;
window.filtrarReporte = filtrarReporte;
window.limpiarFiltrosReporte = limpiarFiltrosReporte;
window.generarReportePDF = generarReportePDF;
window.generarBotonesFechas = generarBotonesFechas;
window.toggleFechaAsistencia = toggleFechaAsistencia;
window.actualizarContadorAsistencia = actualizarContadorAsistencia;
window.obtenerFechasSeleccionadas = obtenerFechasSeleccionadas;
window.marcarFechasGuardadas = marcarFechasGuardadas;
window.actualizarDuracionConferencia = actualizarDuracionConferencia;

console.log('✅ main.js cargado correctamente con todas las funciones');



























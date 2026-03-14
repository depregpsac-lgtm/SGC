// db.js - Funciones de Base de Datos
console.log('🗄️ db.js cargado');

// ... (Todas las funciones CRUD existentes para Zonas, Distritos, Iglesias, Conferencias, Asistentes, Usuarios y Estadísticas se mantienen igual) ...

// ============================================
// FUNCIONES DE AUTENTICACIÓN AGREGADAS
// ============================================

async function iniciarSesion(email, password) {
    try {
        // Buscar usuario por email
        const { data: usuarios, error } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuarios) {
            return { success: false, message: 'Credenciales incorrectas' };
        }

        // Verificar contraseña (en producción, deberías usar un hash seguro)
        // Para este ejemplo, asumimos que la contraseña se guarda en texto plano en 'password_hash'
        if (usuarios.password_hash !== password) {
            return { success: false, message: 'Credenciales incorrectas' };
        }

        // Guardar información del usuario en localStorage
        const userSession = {
            id: usuarios.id,
            nombre: usuarios.nombre_completo,
            email: usuarios.email,
            rol: usuarios.rol
        };
        localStorage.setItem('user', JSON.stringify(userSession));

        return { success: true, user: userSession };
    } catch (error) {
        console.error('❌ Error en iniciarSesion:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('❌ Error parseando usuario de localStorage:', e);
        localStorage.removeItem('user');
        return null;
    }
}

function esAdmin() {
    const user = checkAuth();
    return user && (user.rol === 'admin' || user.rol === 'administrador');
}

// Exportar funciones globales (agregando las nuevas)
window.obtenerZonas = obtenerZonas;
window.crearZona = crearZona;
window.actualizarZona = actualizarZona;
window.eliminarZona = eliminarZona;
window.obtenerDistritos = obtenerDistritos;
window.crearDistrito = crearDistrito;
window.actualizarDistrito = actualizarDistrito;
window.eliminarDistrito = eliminarDistrito;
window.obtenerIglesias = obtenerIglesias;
window.crearIglesia = crearIglesia;
window.actualizarIglesia = actualizarIglesia;
window.eliminarIglesia = eliminarIglesia;
window.obtenerConferencias = obtenerConferencias;
window.crearConferencia = crearConferencia;
window.actualizarConferencia = actualizarConferencia;
window.eliminarConferencia = eliminarConferencia;
window.obtenerAsistentes = obtenerAsistentes;
window.crearAsistente = crearAsistente;
window.actualizarAsistente = actualizarAsistente;
window.eliminarAsistente = eliminarAsistente;
window.obtenerUsuarios = obtenerUsuarios;
window.crearUsuario = crearUsuario;
window.actualizarUsuario = actualizarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.obtenerEstadisticas = obtenerEstadisticas;

// Nuevas exports
window.iniciarSesion = iniciarSesion;
window.checkAuth = checkAuth;
window.esAdmin = esAdmin;

console.log('✅ db.js inicializado con todas las funciones CRUD y de autenticación');

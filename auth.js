// auth.js - Sistema de Autenticación MinistryLion
console.log('🔐 auth.js cargado');

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
function checkAuth() {
    try {
        const user = localStorage.getItem('user');
        if (!user) {
            console.log('🔐 No hay usuario en localStorage');
            return null;
        }
        
        // ✅ Validar que sea JSON válido antes de parsear
        if (!user.startsWith('{')) {
            console.log('❌ Datos corruptos en localStorage, limpiando...');
            localStorage.removeItem('user');
            return null;
        }
        
        const userData = JSON.parse(user);
        console.log('✅ Usuario autenticado:', userData.nombre);
        return userData;
    } catch (error) {
        console.error('❌ Error verificando auth:', error);
        localStorage.removeItem('user');
        return null;
    }
}

// ============================================
// INICIAR SESIÓN
// ============================================
async function iniciarSesion(email, password) {
    try {
        console.log('🔐 Intentando iniciar sesión...', email);
        
        // Usuario demo hardcodeado para pruebas
        if (email === 'admin@ministrylion.com' && password === 'admin123') {
            const userDemo = {
                id: '1',
                nombre: 'Administrador',
                email: email,
                rol: 'admin',
                permisos: ['dashboard', 'conferencias', 'registros', 'configuracion', 'usuarios', 'reportes'],
                conferencias_asignadas: [] // Admin ve todo
            };
            
            localStorage.setItem('user', JSON.stringify(userDemo));
            console.log('✅ Login demo exitoso');
            return { success: true, user: userDemo };
        }
        
        // Intentar autenticar con Supabase
        if (!window.db) {
            throw new Error('Base de datos no inicializada');
        }
        
        const { data, error } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('email', email)
            .eq('password_hash', password)
            .eq('estado', 'activo')
            .single();
        
        if (error || !data) {
            console.error('❌ Credenciales inválidas');
            return { success: false, message: 'Correo o contraseña incorrectos' };
        }
        
        // ✅ Parsear permisos de forma segura
        let permisosArray = [];
        if (data.permisos) {
            try {
                if (typeof data.permisos === 'string' && data.permisos.startsWith('\\"[')) {
                    const cleanPermisos = data.permisos.replace(/^\\"|\\"$/g, '').replace(/^"|"$/g, '');
                    permisosArray = JSON.parse(cleanPermisos);
                } else {
                    permisosArray = typeof data.permisos === 'string' 
                        ? JSON.parse(data.permisos) 
                        : data.permisos;
                }
            } catch (e) {
                console.error('❌ Error parseando permisos:', e);
                if (typeof data.permisos === 'string') {
                    permisosArray = data.permisos.split(',').map(p => p.trim()).filter(p => p);
                }
            }
        }
        
        // ✅ Obtener conferencias asignadas
        let conferenciasAsignadas = [];
        if (data.rol !== 'admin' && data.rol !== 'administrador') {
            if (window.obtenerAsignacionesUsuario) {
                const asignaciones = await window.obtenerAsignacionesUsuario(data.id);
                conferenciasAsignadas = asignaciones.map(a => a.conferencia_id);
            } else if (data.conferencias_asignadas) {
                try {
                    conferenciasAsignadas = typeof data.conferencias_asignadas === 'string' 
                        ? JSON.parse(data.conferencias_asignadas) 
                        : data.conferencias_asignadas;
                } catch (e) {
                    conferenciasAsignadas = [];
                }
            }
        }
        
        const user = {
            id: data.id,
            nombre: data.nombre_completo,
            email: data.email,
            rol: data.rol,
            permisos: permisosArray,
            conferencias_asignadas: conferenciasAsignadas // ✅ NUEVO
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Login exitoso:', user);
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
function cerrarSesion() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('user');
    window.location.reload();
}

// ============================================
// VERIFICAR PERMISOS
// ============================================
function tienePermiso(permiso) {
    const user = checkAuth();
    if (!user) return false;
    return user.permisos.includes(permiso) || user.rol === 'admin';
}

// ============================================
// VERIFICAR SI ES ADMINISTRADOR
// ============================================
function esAdmin() {
    const user = checkAuth();
    if (!user) return false;
    return user.rol === 'admin' || user.rol === 'administrador';
}

// ============================================
// ✅ VERIFICAR ACCESO A CONFERENCIA
// ============================================
function tieneAccesoConferencia(conferencia_id) {
    const user = checkAuth();
    if (!user) return false;
    
    // Admin tiene acceso a todo
    if (user.rol === 'admin' || user.rol === 'administrador') {
        return true;
    }
    
    // Verificar si la conferencia está en las asignadas
    if (user.conferencias_asignadas && user.conferencias_asignadas.length > 0) {
        return user.conferencias_asignadas.includes(conferencia_id) || 
               user.conferencias_asignadas.includes(String(conferencia_id));
    }
    
    return false;
}

// ============================================
// ✅ OBTENER CONFERENCIAS PERMITIDAS
// ============================================
function obtenerConferenciasPermitidas() {
    const user = checkAuth();
    if (!user) return [];
    
    // Admin puede ver todas
    if (user.rol === 'admin' || user.rol === 'administrador') {
        return 'all';
    }
    
    return user.conferencias_asignadas || [];
}

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
function obtenerUsuarioActual() {
    return checkAuth();
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.checkAuth = checkAuth;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.tienePermiso = tienePermiso;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.esAdmin = esAdmin;
window.tieneAccesoConferencia = tieneAccesoConferencia;
window.obtenerConferenciasPermitidas = obtenerConferenciasPermitidas;

console.log('✅ auth.js inicializado correctamente');

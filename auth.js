// auth.js - Sistema de Autenticación MinistryLion
// ============================================
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
        if (email === 'ministrylion@gmail.com' && password === 'admin') {
            const userDemo = {
                id: '1',
                nombre: 'Administrador',
                email: email,
                rol: 'admin',
                permisos: ['dashboard', 'conferencias', 'registros', 'configuracion', 'usuarios', 'reportes']
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
            .eq('password_hash', password)  // ✅ Cambiado de 'password' a 'password_hash'
            .eq('estado', 'activo')
            .single();
        
        if (error || !data) {
            console.error('❌ Credenciales inválidas');
            return { success: false, message: 'Correo o contraseña incorrectos' };
        }
        
        const user = {
            id: data.id,
            nombre: data.nombre_completo,
            email: data.email,
            rol: data.rol,
            permisos: JSON.parse(data.permisos || '[]')
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
// OBTENER USUARIO ACTUAL
// ============================================
function obtenerUsuarioActual() {
    return checkAuth();
}

// VERIFICAR SI ES ADMINISTRADOR
// ============================================
function esAdmin() {
    const user = checkAuth();
    if (!user) return false;
    return user.rol === 'admin';
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.checkAuth = checkAuth;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.tienePermiso = tienePermiso;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.esAdmin = esAdmin;  // ✅ Nueva función
console.log('✅ auth.js inicializado correctamente');







// app.js - Funciones para conectar con Supabase
// ============================================
console.log('🔍 app.js cargado');
console.log('🔍 window.db existe:', !!window.db);

// ============================================
// AUTENTICACIÓN
// ============================================
async function login(email, password) {
    console.log('🔐 Intentando login...', email);
    try {
        if (!window.db) {
            console.error('❌ window.db no existe');
            throw new Error('No hay conexión con la base de datos. Recarga la página.');
        }
        
        console.log('📡 Consultando base de datos...');
        const { data, error } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('email', email)
            .eq('estado', 'activo')
            .single();
        
        console.log('📡 Respuesta:', { data, error });
        
        if (error || !data) {
            console.error('❌ Error de consulta:', error);
            return { 
                success: false, 
                error: 'Credenciales inválidas o usuario inactivo' 
            };
        }
        
        if (data.password_hash !== password) {
            return { 
                success: false, 
                error: 'Contraseña incorrecta' 
            };
        }
        
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            nombre: data.nombre_completo,
            email: data.email,
            rol: data.rol,
            permisos: data.permisos
        }));
        
        console.log('✅ Login exitoso:', data.nombre_completo);
        return { 
            success: true, 
            user: data 
        };
    } catch (error) {
        console.error('❌ Error en login:', error);
        return { 
            success: false, 
            error: 'Error de conexión: ' + error.message 
        };
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    return JSON.parse(user);
}

// ============================================
// UTILIDADES - MENSAJES TOAST
// ============================================
function mostrarMensaje(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; animation: slideIn 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;
    if (tipo === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (tipo === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// UTILIDADES - FECHAS
// ============================================
function fechaISOaLocal(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T00:00:00');
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearFechaParaTabla(fecha) {
    if (!fecha) return '';
    const fechaLocal = fechaISOaLocal(fecha);
    const [year, month, day] = fechaLocal.split('-');
    return `${day}/${month}/${year}`;
}

function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;
    const d1 = new Date(inicio + 'T00:00:00');
    const d2 = new Date(fin + 'T00:00:00');
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================
// ANIMACIONES PARA TOAST
// ============================================
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
    document.head.appendChild(style);
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.mostrarMensaje = mostrarMensaje;
window.fechaISOaLocal = fechaISOaLocal;
window.formatearFechaParaTabla = formatearFechaParaTabla;
window.calcularDias = calcularDias;
console.log('✅ app.js cargado correctamente con todas las funciones');

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
        // Verificar que window.db exista
        if (!window.db) {
            console.error('❌ window.db no existe');
            throw new Error('No hay conexión con la base de datos. Recarga la página.');
        }
        
        // Buscar usuario en la tabla usuarios_sistema
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
        
        // Verificar password
        if (data.password_hash !== password) {
            return { 
                success: false, 
                error: 'Contraseña incorrecta' 
            };
        }
        
        // Guardar sesión en localStorage
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
// ZONAS
// ============================================
async function obtenerZonas() {
    const { data, error } = await window.db
        .from('zonas')
        .select('*')
        .order('nombre');
    if (error) throw error;
    return data;
}

async function crearZona(nombre, descripcion) {
    const { data, error } = await window.db
        .from('zonas')
        .insert([{ nombre, descripcion }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarZona(id, nombre, descripcion) {
    const { data, error } = await window.db
        .from('zonas')
        .update({ nombre, descripcion, updated_at: new Date() })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarZona(id) {
    const { data: distritos, error: checkError } = await window.db
        .from('distritos')
        .select('id')
        .eq('zona_id', id)
        .limit(1);
    if (checkError) throw checkError;
    if (distritos && distritos.length > 0) {
        throw new Error('No se puede eliminar: hay distritos asociados');
    }
    const { error } = await window.db
        .from('zonas')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// DISTRITOS
// ============================================
async function obtenerDistritos() {
    const { data, error } = await window.db
        .from('distritos')
        .select(`*, zonas (nombre)`)
        .order('nombre');
    if (error) throw error;
    return data;
}

async function crearDistrito(zona_id, nombre, responsable, telefono) {
    const { data, error } = await window.db
        .from('distritos')
        .insert([{ zona_id, nombre, responsable, telefono }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarDistrito(id, zona_id, nombre, responsable, telefono) {
    const { data, error } = await window.db
        .from('distritos')
        .update({ zona_id, nombre, responsable, telefono, updated_at: new Date() })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarDistrito(id) {
    const { data: iglesias, error: checkError } = await window.db
        .from('iglesias')
        .select('id')
        .eq('distrito_id', id)
        .limit(1);
    if (checkError) throw checkError;
    if (iglesias && iglesias.length > 0) {
        throw new Error('No se puede eliminar: hay iglesias asociadas');
    }
    const { error } = await window.db
        .from('distritos')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// IGLESIAS
// ============================================
async function obtenerIglesias() {
    const { data, error } = await window.db
        .from('iglesias')
        .select(`*, zonas (nombre), distritos (nombre)`)
        .order('nombre');
    if (error) throw error;
    return data;
}

async function crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono) {
    const { data, error } = await window.db
        .from('iglesias')
        .insert([{ zona_id, distrito_id, nombre, pastor, direccion, telefono }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarIglesia(id, zona_id, distrito_id, nombre, pastor, direccion, telefono) {
    const { data, error } = await window.db
        .from('iglesias')
        .update({ zona_id, distrito_id, nombre, pastor, direccion, telefono, updated_at: new Date() })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarIglesia(id) {
    const { data: conferencias, error: checkError } = await window.db
        .from('conferencias')
        .select('id')
        .eq('iglesia_id', id)
        .limit(1);
    if (checkError) throw checkError;
    if (conferencias && conferencias.length > 0) {
        throw new Error('No se puede eliminar: hay conferencias asociadas');
    }
    const { error } = await window.db
        .from('iglesias')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// CONFERENCIAS
// ============================================
async function obtenerConferencias() {
    const { data, error } = await window.db
        .from('conferencias')
        .select(`*, iglesias (nombre)`)
        .order('fecha_inicio', { ascending: false });
    if (error) throw error;
    return data;
}

async function crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante) {
    const { data, error } = await window.db
        .from('conferencias')
        .insert([{
            iglesia_id,
            nombre,
            fecha_inicio,
            fecha_fin,
            conferenciante
        }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarConferencia(id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante) {
    const { data, error } = await window.db
        .from('conferencias')
        .update({
            iglesia_id,
            nombre,
            fecha_inicio,
            fecha_fin,
            conferenciante
        })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarConferencia(id) {
    const { data: asistentes, error: checkError } = await window.db
        .from('asistentes')
        .select('id')
        .eq('conferencia_id', id)
        .limit(1);
    if (checkError) throw checkError;
    if (asistentes && asistentes.length > 0) {
        throw new Error('No se puede eliminar: hay asistentes registrados');
    }
    const { error } = await window.db
        .from('conferencias')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// ASISTENTES
// ============================================
async function obtenerAsistentes(conferencia_id = null) {
    let query = window.db
        .from('asistentes')
        .select(`*, iglesias (nombre), conferencias (nombre)`);
    if (conferencia_id) {
        query = query.eq('conferencia_id', conferencia_id);
    }
    const { data, error } = await query.order('nombre_completo');
    if (error) throw error;
    return data;
}

async function crearAsistente(datos) {
    const { data, error } = await window.db
        .from('asistentes')
        .insert([{
            nombre_completo: datos.nombre_completo,
            direccion: datos.direccion,
            telefono: datos.telefono,
            invitado_por: datos.invitado_por,
            iglesia_id: datos.iglesia_id,
            conferencia_id: datos.conferencia_id,
            fechas_asistencia: datos.fechas_asistencia || '[]'
        }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarAsistente(id, datos) {
    const { data, error } = await window.db
        .from('asistentes')
        .update({
            nombre_completo: datos.nombre_completo,
            direccion: datos.direccion,
            telefono: datos.telefono,
            invitado_por: datos.invitado_por,
            iglesia_id: datos.iglesia_id,
            conferencia_id: datos.conferencia_id,
            fechas_asistencia: datos.fechas_asistencia || '[]',
            updated_at: new Date()
        })
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarAsistente(id) {
    const { error } = await window.db
        .from('asistentes')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// USUARIOS
// ============================================
async function obtenerUsuarios() {
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .select('*')
        .order('nombre_completo');
    if (error) throw error;
    return data;
}

async function crearUsuario(nombre_completo, email, password_hash, rol, permisos, estado) {
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .insert([{ nombre_completo, email, password_hash, rol, permisos, estado }])
        .select();
    if (error) throw error;
    return data;
}

async function actualizarUsuario(id, nombre_completo, email, password_hash, rol, permisos, estado) {
    const updateData = { nombre_completo, email, rol, permisos, estado, updated_at: new Date() };
    if (password_hash && password_hash.trim() !== '') {
        updateData.password_hash = password_hash;
    }
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .update(updateData)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data;
}

async function eliminarUsuario(id) {
    const { data: admins, error: checkError } = await window.db
        .from('usuarios_sistema')
        .select('id')
        .eq('rol', 'administrador')
        .eq('estado', 'activo');
    if (checkError) throw checkError;
    if (admins && admins.length <= 1) {
        throw new Error('No se puede eliminar: debe haber al menos un administrador activo');
    }
    const { error } = await window.db
        .from('usuarios_sistema')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// ESTADÍSTICAS
// ============================================
async function obtenerEstadisticas() {
    try {
        const { data, error } = await window.db
            .from('vista_estadisticas')
            .select('*')
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.log('Vista de estadísticas no disponible');
        return {
            total_zonas: 0,
            total_distritos: 0,
            total_iglesias: 0,
            total_conferencias: 0,
            total_asistentes: 0
        };
    }
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
// UTILIDADES - FECHAS (CORREGIDO PARA TIMEZONE)
// ============================================

// Convertir fecha ISO a formato YYYY-MM-DD sin timezone (PARA INPUTS)
function fechaISOaLocal(fechaISO) {
    if (!fechaISO) return '';
    // Agregar T00:00:00 para evitar problema de timezone
    const fecha = new Date(fechaISO + 'T00:00:00');
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formatear fecha para mostrar en tablas (DD/MM/YYYY)
function formatearFechaParaTabla(fecha) {
    if (!fecha) return '';
    const fechaLocal = fechaISOaLocal(fecha);
    const [year, month, day] = fechaLocal.split('-');
    return `${day}/${month}/${year}`;
}

// Calcular días entre dos fechas (inclusive) - SIN TIMEZONE
function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;
    const d1 = new Date(inicio + 'T00:00:00');
    const d2 = new Date(fin + 'T00:00:00');
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Formatear fecha larga para mostrar
function formatearFecha(fecha) {
    if (!fecha) return '';
    const fechaLocal = fechaISOaLocal(fecha);
    const [year, month, day] = fechaLocal.split('-');
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${day} de ${meses[parseInt(month) - 1]} de ${year}`;
}

// Formatear fecha corta (DD/MM/YYYY)
function formatearFechaCorta(fecha) {
    if (!fecha) return '';
    return formatearFechaParaTabla(fecha);
}

// ============================================
// ANIMACIONES PARA TOAST
// ============================================
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn { 
            from { transform: translateX(100%); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
        } 
        @keyframes slideOut { 
            from { transform: translateX(0); opacity: 1; } 
            to { transform: translateX(100%); opacity: 0; } 
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
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
window.mostrarMensaje = mostrarMensaje;
window.fechaISOaLocal = fechaISOaLocal;
window.formatearFechaParaTabla = formatearFechaParaTabla;
window.calcularDias = calcularDias;
window.formatearFecha = formatearFecha;
window.formatearFechaCorta = formatearFechaCorta;

console.log('✅ app.js cargado correctamente con todas las funciones');

// db.js - Configuración de Base de Datos Supabase
console.log('🗄️ db.js cargado');

// ============================================
// ⚙️ CONFIGURACIÓN DE SUPABASE
// ============================================
// 🔴 IMPORTANTE: Reemplaza estos valores con los de tu proyecto en Supabase
const SUPABASE_URL = 'https://qalzqyjuyptemtrhwsbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr';

// Inicializar cliente de Supabase
if (typeof window.supabase !== 'undefined') {
    window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Conectado a Supabase:', SUPABASE_URL);
} else {
    console.error('❌ La librería de Supabase no está cargada. Verifica que el script esté incluido en el HTML.');
}

// ============================================
// 🔐 FUNCIONES DE AUTENTICACIÓN
// ============================================

// Iniciar sesión
async function iniciarSesion(email, password) {
    try {
        console.log('🔐 Intentando iniciar sesión con:', email);
        
        // Buscar usuario en la tabla usuarios_sistema
        const { data: usuario, error: fetchError } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('email', email)
            .eq('estado', 'activo')
            .single();
        
        if (fetchError || !usuario) {
            console.error('❌ Usuario no encontrado o inactivo');
            return {
                success: false,
                message: '❌ Correo o contraseña incorrectos'
            };
        }
        
        // Verificar contraseña (en producción deberías usar hash)
        if (usuario.password_hash !== password) {
            console.error('❌ Contraseña incorrecta');
            return {
                success: false,
                message: '❌ Correo o contraseña incorrectos'
            };
        }
        
        // Guardar sesión en localStorage
        const userSession = {
            id: usuario.id,
            nombre: usuario.nombre_completo,
            email: usuario.email,
            rol: usuario.rol,
            permisos: usuario.permisos,
            estado: usuario.estado
        };
        
        localStorage.setItem('user', JSON.stringify(userSession));
        console.log('✅ Sesión iniciada exitosamente:', userSession.nombre);
        
        return {
            success: true,
            user: userSession,
            message: '✅ Inicio de sesión exitoso'
        };
    } catch (error) {
        console.error('❌ Error en iniciarSesion:', error);
        return {
            success: false,
            message: '❌ Error de conexión: ' + error.message
        };
    }
}

// Verificar si hay sesión activa
function checkAuth() {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log('🔐 No hay sesión activa');
            return null;
        }
        
        const user = JSON.parse(userStr);
        console.log('✅ Sesión verificada:', user.nombre);
        return user;
    } catch (error) {
        console.error('❌ Error verificando sesión:', error);
        localStorage.removeItem('user');
        return null;
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('user');
    console.log('🚪 Sesión cerrada');
    window.location.reload();
}

// Verificar si es administrador
function esAdmin() {
    const user = checkAuth();
    return user && (user.rol === 'admin' || user.rol === 'administrador');
}

// ============================================
// 📍 ZONAS
// ============================================
async function obtenerZonas() {
    try {
        const { data, error } = await window.db.from('zonas').select('*').order('nombre');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo zonas:', error);
        return [];
    }
}

async function crearZona(nombre, descripcion) {
    const { data, error } = await window.db.from('zonas').insert([{ nombre, descripcion }]).select();
    if (error) throw error;
    return data[0];
}

async function actualizarZona(id, nombre, descripcion) {
    const { data, error } = await window.db.from('zonas').update({ nombre, descripcion }).eq('id', id).select();
    if (error) throw error;
    return data[0];
}

async function eliminarZona(id) {
    const { error } = await window.db.from('zonas').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// 🏛️ DISTRITOS
// ============================================
async function obtenerDistritos() {
    try {
        const { data, error } = await window.db.from('distritos').select('*, zonas(nombre)').order('nombre');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo distritos:', error);
        return [];
    }
}

async function crearDistrito(zona_id, nombre, responsable, telefono) {
    const { data, error } = await window.db.from('distritos').insert([{ zona_id, nombre, responsable, telefono }]).select();
    if (error) throw error;
    return data[0];
}

async function actualizarDistrito(id, zona_id, nombre, responsable, telefono) {
    const { data, error } = await window.db.from('distritos').update({ zona_id, nombre, responsable, telefono }).eq('id', id).select();
    if (error) throw error;
    return data[0];
}

async function eliminarDistrito(id) {
    const { error } = await window.db.from('distritos').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// ⛪ IGLESIAS
// ============================================
async function obtenerIglesias() {
    try {
        const { data, error } = await window.db.from('iglesias').select('*, zonas(nombre), distritos(nombre)').order('nombre');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo iglesias:', error);
        return [];
    }
}

async function crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono) {
    const { data, error } = await window.db.from('iglesias').insert([{ zona_id, distrito_id, nombre, pastor, direccion, telefono }]).select();
    if (error) throw error;
    return data[0];
}

async function actualizarIglesia(id, zona_id, distrito_id, nombre, pastor, direccion, telefono) {
    const { data, error } = await window.db.from('iglesias').update({ zona_id, distrito_id, nombre, pastor, direccion, telefono }).eq('id', id).select();
    if (error) throw error;
    return data[0];
}

async function eliminarIglesia(id) {
    const { error } = await window.db.from('iglesias').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// 📅 CONFERENCIAS
// ============================================
async function obtenerConferencias() {
    try {
        const { data, error } = await window.db.from('conferencias').select('*, iglesias(nombre)').order('fecha_inicio', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo conferencias:', error);
        return [];
    }
}

async function crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante) {
    const { data, error } = await window.db.from('conferencias').insert([{ iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante }]).select();
    if (error) throw error;
    return data[0];
}

async function actualizarConferencia(id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante) {
    const { data, error } = await window.db.from('conferencias').update({ iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante }).eq('id', id).select();
    if (error) throw error;
    return data[0];
}

async function eliminarConferencia(id) {
    // Primero eliminar asistentes relacionados (si existen)
    try {
        await window.db.from('asistentes').delete().eq('conferencia_id', id);
    } catch (assistError) {
        // Ignorar error si no hay asistentes o si falla esta operación
        console.warn('⚠️ No se pudo eliminar asistentes o no existen:', assistError.message);
    }
    
    // Eliminar la conferencia
    const { data, error } = await window.db.from('conferencias').delete().eq('id', id).select();
    
    if (error) {
        console.error('❌ Error eliminando conferencia:', error);
        throw error;
    }
    
    if (!data || data.length === 0) {
        console.warn('⚠️ No se eliminó ninguna conferencia, ID no encontrado:', id);
        throw new Error('Conferencia no encontrada');
    }
    
    console.log('✅ Conferencia eliminada exitosamente:', id);
    return true;
}

// ============================================
// 👥 ASISTENTES
// ============================================
async function obtenerAsistentes() {
    try {
        const { data, error } = await window.db.from('asistentes').select('*, iglesias(nombre), conferencias(nombre)').order('nombre_completo');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo asistentes:', error);
        return [];
    }
}

async function crearAsistente(datos) {
    // Obtener los días específicos del formulario
    const diasEspecificos = document.getElementById('registroDiasEspecificos')?.value || '';
    
    const { data, error } = await window.db.from('asistentes').insert([{
        ...datos,
        dias_especificos: diasEspecificos  // ✅ Agregar días específicos
    }]).select();
    
    if (error) throw error;
    return data[0];
}

async function actualizarAsistente(id, datos) {
    // Obtener los días específicos del formulario
    const diasEspecificos = document.getElementById('registroDiasEspecificos')?.value || '';
    
    const { data, error } = await window.db.from('asistentes').update({
        ...datos,
        dias_especificos: diasEspecificos  // ✅ Actualizar días específicos
    }).eq('id', id).select();
    
    if (error) throw error;
    return data[0];
}

async function eliminarAsistente(id) {
    const { error } = await window.db.from('asistentes').delete().eq('id', id);
    if (error) throw error;
    return true;
}

async function borrarTodosLosRegistros() {
    const { error } = await window.db.from('asistentes').delete().neq('id', 0);
    if (error) throw error;
    return true;
}

// ============================================
// 👤 USUARIOS DEL SISTEMA
// ============================================
async function obtenerUsuarios() {
    console.log('🔍 db.obtenerUsuarios() called');
    try {
        const { data, error } = await window.db
            .from('usuarios_sistema')
            .select('*, conferencias(nombre)')
            .order('nombre_completo');
        
        if (error) {
            console.error('❌ Supabase query error:', error);
            throw error;
        }
        
        console.log('✅ Fetched', data?.length || 0, 'users from Supabase');
        return data || [];
    } catch (error) {
        console.error('💥 obtenerUsuarios full error:', error);
        return [];
    }
}

async function crearUsuario(nombre_completo, email, password, rol, conferencia_id, estado) {
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .insert([{
            nombre_completo,
            email,
            password_hash: password,
            rol,
            conferencia_id,
            estado
        }])
        .select();
    if (error) throw error;
    return data[0];
}

async function actualizarUsuario(id, nombre_completo, email, password, rol, conferencia_id, estado) {
    const updateData = { nombre_completo, email, rol, conferencia_id, estado };
    if (password && password.trim() !== '') {
        updateData.password_hash = password;
    }
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .update(updateData)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
}

async function eliminarUsuario(id) {
    console.log('🗑️ db.eliminarUsuario called with ID:', id);
    try {
        const { error } = await window.db
            .from('usuarios_sistema')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('❌ Supabase DELETE error:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('✅ User successfully deleted from Supabase');
        return true;
    } catch (error) {
        console.error('💥 eliminarUsuario full error:', error);
        throw error;
    }
}

// ============================================
// 📊 ESTADÍSTICAS
// ============================================
async function obtenerEstadisticas() {
    try {
        const [zonas, distritos, iglesias, conferencias, asistentes] = await Promise.all([
            window.db.from('zonas').select('id', { count: 'exact', head: true }),
            window.db.from('distritos').select('id', { count: 'exact', head: true }),
            window.db.from('iglesias').select('id', { count: 'exact', head: true }),
            window.db.from('conferencias').select('id', { count: 'exact', head: true }),
            window.db.from('asistentes').select('id', { count: 'exact', head: true })
        ]);
        
        return {
            total_zonas: zonas.count || 0,
            total_distritos: distritos.count || 0,
            total_iglesias: iglesias.count || 0,
            total_conferencias: conferencias.count || 0,
            total_asistentes: asistentes.count || 0
        };
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
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
// 📤 EXPORTAR FUNCIONES GLOBALES
// ============================================
window.iniciarSesion = iniciarSesion;
window.checkAuth = checkAuth;
window.cerrarSesion = cerrarSesion;
window.esAdmin = esAdmin;

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
window.borrarTodosLosRegistros = borrarTodosLosRegistros;

window.obtenerUsuarios = obtenerUsuarios;
window.crearUsuario = crearUsuario;
window.actualizarUsuario = actualizarUsuario;
window.eliminarUsuario = eliminarUsuario;

window.obtenerEstadisticas = obtenerEstadisticas;

console.log('✅ db.js inicializado con todas las funciones CRUD y autenticación');





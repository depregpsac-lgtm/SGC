// db.js - Configuración de Base de Datos Supabase
console.log('🗄️ db.js cargado');

// ============================================
// ⚙️ CONFIGURACIÓN DE SUPABASE
// ============================================
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
async function iniciarSesion(email, password) {
    try {
        console.log('🔐 Intentando iniciar sesión con:', email);
        
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
            return {
                success: true,
                user: userDemo,
                message: '✅ Inicio de sesión exitoso'
            };
        }
        
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
        
        // Verificar contraseña
        if (usuario.password_hash !== password) {
            console.error('❌ Contraseña incorrecta');
            return {
                success: false,
                message: '❌ Correo o contraseña incorrectos'
            };
        }
        
        // ✅ Obtener conferencias asignadas al usuario
        let conferenciasAsignadas = [];
        if (usuario.rol !== 'admin' && usuario.rol !== 'administrador') {
            // Intentar obtener de la tabla usuario_conferencias
            const { data: asignaciones, error: asignError } = await window.db
                .from('usuario_conferencias')
                .select('conferencia_id')
                .eq('usuario_id', usuario.id);
            
            if (!asignError && asignaciones) {
                conferenciasAsignadas = asignaciones.map(a => a.conferencia_id);
            } else if (usuario.conferencias_asignadas) {
                // Fallback a columna en usuarios_sistema
                try {
                    conferenciasAsignadas = typeof usuario.conferencias_asignadas === 'string' 
                        ? JSON.parse(usuario.conferencias_asignadas) 
                        : usuario.conferencias_asignadas;
                } catch (e) {
                    conferenciasAsignadas = [];
                }
            }
        }
        
        // Parsear permisos
        let permisosArray = [];
        if (usuario.permisos) {
            try {
                if (typeof usuario.permisos === 'string') {
                    if (usuario.permisos.startsWith('\\"[')) {
                        const cleanPermisos = usuario.permisos.replace(/^\\"|\\"$/g, '').replace(/^"|"$/g, '');
                        permisosArray = JSON.parse(cleanPermisos);
                    } else {
                        permisosArray = JSON.parse(usuario.permisos);
                    }
                } else {
                    permisosArray = usuario.permisos;
                }
            } catch (e) {
                console.error('❌ Error parseando permisos:', e);
                if (typeof usuario.permisos === 'string') {
                    permisosArray = usuario.permisos.split(',').map(p => p.trim()).filter(p => p);
                }
            }
        }
        
        // Guardar sesión en localStorage
        const userSession = {
            id: usuario.id,
            nombre: usuario.nombre_completo,
            email: usuario.email,
            rol: usuario.rol,
            permisos: permisosArray,
            estado: usuario.estado,
            conferencias_asignadas: conferenciasAsignadas // ✅ NUEVO
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

function cerrarSesion() {
    localStorage.removeItem('user');
    console.log('🚪 Sesión cerrada');
    window.location.reload();
}

function esAdmin() {
    const user = checkAuth();
    return user && (user.rol === 'admin' || user.rol === 'administrador');
}

// ✅ VERIFICAR SI TIENE ACCESO A CONFERENCIA
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

// ✅ OBTENER CONFERENCIAS PERMITIDAS PARA USUARIO
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
    await window.db.from('asistentes').delete().eq('conferencia_id', id);
    const { error } = await window.db.from('conferencias').delete().eq('id', id);
    if (error) throw error;
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
    const { data, error } = await window.db.from('asistentes').insert([datos]).select();
    if (error) throw error;
    return data[0];
}

async function actualizarAsistente(id, datos) {
    const { data, error } = await window.db.from('asistentes').update(datos).eq('id', id).select();
    if (error) throw error;
    return data[0];
}

async function eliminarAsistente(id) {
    const { error } = await window.db.from('asistentes').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// 👤 USUARIOS DEL SISTEMA
// ============================================
async function obtenerUsuarios() {
    try {
        const { data, error } = await window.db.from('usuarios_sistema').select('*').order('nombre_completo');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        return [];
    }
}

async function crearUsuario(nombre_completo, email, password, rol, permisos, estado, conferencias_asignadas = null) {
    const insertData = {
        nombre_completo,
        email,
        password_hash: password,
        rol,
        permisos,
        estado
    };
    
    // ✅ Agregar conferencias asignadas si existen
    if (conferencias_asignadas) {
        insertData.conferencias_asignadas = conferencias_asignadas;
    }
    
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .insert([insertData])
        .select();
    if (error) throw error;
    
    // ✅ Si hay conferencias asignadas, crear registros en usuario_conferencias
    if (conferencias_asignadas && data[0]?.id) {
        const usuario_id = data[0].id;
        const conferenciasArray = typeof conferencias_asignadas === 'string' 
            ? JSON.parse(conferencias_asignadas) 
            : conferencias_asignadas;
        
        if (Array.isArray(conferenciasArray) && conferenciasArray.length > 0) {
            const asignaciones = conferenciasArray.map(conf_id => ({
                usuario_id,
                conferencia_id: conf_id
            }));
            
            await window.db
                .from('usuario_conferencias')
                .insert(asignaciones);
        }
    }
    
    return data[0];
}

async function actualizarUsuario(id, nombre_completo, email, password, rol, permisos, estado, conferencias_asignadas = null) {
    const updateData = { nombre_completo, email, rol, permisos, estado };
    if (password && password.trim() !== '') {
        updateData.password_hash = password;
    }
    
    // ✅ Agregar conferencias asignadas si existen
    if (conferencias_asignadas !== null) {
        updateData.conferencias_asignadas = conferencias_asignadas;
    }
    
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .update(updateData)
        .eq('id', id)
        .select();
    if (error) throw error;
    
    // ✅ Actualizar registros en usuario_conferencias
    if (conferencias_asignadas !== null) {
        const conferenciasArray = typeof conferencias_asignadas === 'string' 
            ? JSON.parse(conferencias_asignadas) 
            : conferencias_asignadas;
        
        if (Array.isArray(conferenciasArray)) {
            // Eliminar asignaciones anteriores
            await window.db
                .from('usuario_conferencias')
                .delete()
                .eq('usuario_id', id);
            
            // Crear nuevas asignaciones
            if (conferenciasArray.length > 0) {
                const asignaciones = conferenciasArray.map(conf_id => ({
                    usuario_id: id,
                    conferencia_id: conf_id
                }));
                
                await window.db
                    .from('usuario_conferencias')
                    .insert(asignaciones);
            }
        }
    }
    
    return data[0];
}

async function eliminarUsuario(id) {
    // Eliminar asignaciones de conferencias primero
    await window.db.from('usuario_conferencias').delete().eq('usuario_id', id);
    
    const { error } = await window.db.from('usuarios_sistema').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// 📊 ASIGNACIÓN DE CONFERENCIAS A USUARIOS
// ============================================
async function obtenerConferenciasUsuario(usuario_id) {
    try {
        const { data, error } = await window.db
            .from('usuario_conferencias')
            .select('conferencia_id, conferencias(nombre)')
            .eq('usuario_id', usuario_id);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo conferencias del usuario:', error);
        return [];
    }
}

async function asignarConferenciaUsuario(usuario_id, conferencia_id) {
    try {
        const { data, error } = await window.db
            .from('usuario_conferencias')
            .insert([{ usuario_id, conferencia_id }])
            .select();
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('❌ Error asignando conferencia:', error);
        return null;
    }
}

async function eliminarConferenciaUsuario(usuario_id, conferencia_id) {
    try {
        const { error } = await window.db
            .from('usuario_conferencias')
            .delete()
            .eq('usuario_id', usuario_id)
            .eq('conferencia_id', conferencia_id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error eliminando asignación:', error);
        return false;
    }
}

async function obtenerAsignacionesUsuario(usuario_id) {
    try {
        const { data, error } = await window.db
            .from('usuario_conferencias')
            .select('*')
            .eq('usuario_id', usuario_id);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error obteniendo asignaciones:', error);
        return [];
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
window.tieneAccesoConferencia = tieneAccesoConferencia;
window.obtenerConferenciasPermitidas = obtenerConferenciasPermitidas;
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
window.obtenerConferenciasUsuario = obtenerConferenciasUsuario;
window.asignarConferenciaUsuario = asignarConferenciaUsuario;
window.eliminarConferenciaUsuario = eliminarConferenciaUsuario;
window.obtenerAsignacionesUsuario = obtenerAsignacionesUsuario;

console.log('✅ db.js inicializado con todas las funciones CRUD, autenticación y asignación de conferencias');

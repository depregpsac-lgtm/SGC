// db.js - Funciones de Base de Datos
console.log('🗄️ db.js cargado');

// ZONAS
async function obtenerZonas() {
    const { data, error } = await window.db.from('zonas').select('*').order('nombre');
    return error ? [] : (data || []);
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

// DISTRITOS
async function obtenerDistritos() {
    const { data, error } = await window.db.from('distritos').select('*, zonas(nombre)').order('nombre');
    return error ? [] : (data || []);
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

// IGLESIAS
async function obtenerIglesias() {
    const { data, error } = await window.db.from('iglesias').select('*, zonas(nombre), distritos(nombre)').order('nombre');
    return error ? [] : (data || []);
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

// CONFERENCIAS
async function obtenerConferencias() {
    const { data, error } = await window.db.from('conferencias').select('*, iglesias(nombre)').order('fecha_inicio', { ascending: false });
    return error ? [] : (data || []);
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

// ASISTENTES
async function obtenerAsistentes() {
    const { data, error } = await window.db.from('asistentes').select('*, iglesias(nombre), conferencias(nombre)').order('nombre_completo');
    return error ? [] : (data || []);
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

// USUARIOS
// USUARIOS
async function obtenerUsuarios() {
    const { data, error } = await window.db.from('usuarios_sistema').select('*').order('nombre_completo');
    return error ? [] : (data || []);
}

async function crearUsuario(nombre_completo, email, password, rol, permisos, estado) {
    const { data, error } = await window.db
        .from('usuarios_sistema')
        .insert([{ 
            nombre_completo, 
            email, 
            password_hash: password,  // ✅ Cambiado de 'password' a 'password_hash'
            rol, 
            permisos, 
            estado 
        }])
        .select();
    if (error) throw error;
    return data[0];
}

async function actualizarUsuario(id, nombre_completo, email, password, rol, permisos, estado) {
    const updateData = { nombre_completo, email, rol, permisos, estado };
    if (password && password.trim() !== '') {
        updateData.password_hash = password;  // ✅ Cambiado de 'password' a 'password_hash'
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
    const { error } = await window.db.from('usuarios_sistema').delete().eq('id', id);
    if (error) throw error;
    return true;
}
// ESTADÍSTICAS
async function obtenerEstadisticas() {
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
}

// Exportar funciones globales
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
console.log('✅ db.js inicializado con todas las funciones CRUD');

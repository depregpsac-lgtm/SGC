// app.js - Funciones para conectar con Supabase

// ============================================
// AUTENTICACIÓN
// ============================================

async function login(email, password) {
    try {
        const { data, error } = await supabase
            .from('usuarios_sistema')
            .select('*')
            .eq('email', email)
            .eq('estado', 'activo')
            .single();
        
        if (error || !data) {
            throw new Error('Credenciales inválidas');
        }
        
        // Verificar password (en producción usar bcrypt)
        if (data.password_hash !== password) {
            throw new Error('Contraseña incorrecta');
        }
        
        // Guardar sesión
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            nombre: data.nombre_completo,
            email: data.email,
            rol: data.rol,
            permisos: data.permisos
        }));
        
        return { success: true, user: data };
    } catch (error) {
        return { success: false, error: error.message };
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
    const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .order('nombre');
    
    if (error) throw error;
    return data;
}

async function crearZona(nombre, descripcion) {
    const { data, error } = await supabase
        .from('zonas')
        .insert([{ nombre, descripcion }])
        .select();
    
    if (error) throw error;
    return data;
}

async function actualizarZona(id, nombre, descripcion) {
    const { data, error } = await supabase
        .from('zonas')
        .update({ nombre, descripcion })
        .eq('id', id)
        .select();
    
    if (error) throw error;
    return data;
}

async function eliminarZona(id) {
    const { error } = await supabase
        .from('zonas')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

// ============================================
// DISTRITOS
// ============================================

async function obtenerDistritos() {
    const { data, error } = await supabase
        .from('distritos')
        .select(`
            *,
            zonas (nombre)
        `)
        .order('nombre');
    
    if (error) throw error;
    return data;
}

async function crearDistrito(zona_id, nombre, responsable, telefono) {
    const { data, error } = await supabase
        .from('distritos')
        .insert([{ zona_id, nombre, responsable, telefono }])
        .select();
    
    if (error) throw error;
    return data;
}

// ============================================
// IGLESIAS
// ============================================

async function obtenerIglesias() {
    const { data, error } = await supabase
        .from('iglesias')
        .select(`
            *,
            zonas (nombre),
            distritos (nombre)
        `)
        .order('nombre');
    
    if (error) throw error;
    return data;
}

async function crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono) {
    const { data, error } = await supabase
        .from('iglesias')
        .insert([{ zona_id, distrito_id, nombre, pastor, direccion, telefono }])
        .select();
    
    if (error) throw error;
    return data;
}

// ============================================
// CONFERENCIAS
// ============================================

async function obtenerConferencias() {
    const { data, error } = await supabase
        .from('conferencias')
        .select(`
            *,
            iglesias (nombre)
        `)
        .order('fecha_inicio', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante) {
    const { data, error } = await supabase
        .from('conferencias')
        .insert([{ iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante }])
        .select();
    
    if (error) throw error;
    return data;
}

// ============================================
// ASISTENTES
// ============================================

async function obtenerAsistentes(conferencia_id = null) {
    let query = supabase
        .from('asistentes')
        .select(`
            *,
            iglesias (nombre)
        `);
    
    if (conferencia_id) {
        query = query.eq('conferencia_id', conferencia_id);
    }
    
    const { data, error } = await query.order('nombre_completo');
    
    if (error) throw error;
    return data;
}

async function crearAsistente(datos) {
    const { data, error } = await supabase
        .from('asistentes')
        .insert([datos])
        .select();
    
    if (error) throw error;
    return data;
}

// ============================================
// ESTADÍSTICAS
// ============================================

async function obtenerEstadisticas() {
    const { data, error } = await supabase
        .from('vista_estadisticas')
        .select('*')
        .single();
    
    if (error) throw error;
    return data;
}

// ============================================
// UTILIDADES
// ============================================

function mostrarMensaje(mensaje, tipo = 'info') {
    // Implementar según tu diseño
    alert(mensaje);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
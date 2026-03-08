// main.js - Control de botones Editar y Eliminar
// ============================================

// Variable global para modo edición
window.editMode = {
    tipo: null,  // 'zona', 'distrito', 'iglesia', 'conferencia', 'asistente', 'usuario'
    id: null
};

// ============================================
// ZONAS - Editar/Eliminar
// ============================================
async function editarZona(id) {
    try {
        const { data, error } = await window.db
            .from('zonas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Llenar modal con datos
        document.getElementById('zonaNombre').value = data.nombre;
        document.getElementById('zonaDescripcion').value = data.descripcion || '';
        
        // Configurar formulario para edición
        window.editMode = { tipo: 'zona', id: id };
        document.getElementById('formZona').onsubmit = guardarZonaEditada;
        
        // Abrir modal
        abrirModal('modalNuevaZona');
        // CORREGIDO: Cambiar h2 por h3
        const tituloModal = document.querySelector('#modalNuevaZona h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Zona';
        }
        
    } catch (error) {
        mostrarMensaje('Error cargando zona: ' + error.message, 'error');
    }
}

async function guardarZonaEditada(e) {
    e.preventDefault();
    const nombre = document.getElementById('zonaNombre').value;
    const descripcion = document.getElementById('zonaDescripcion').value;
    if (!nombre) {
        mostrarMensaje('El nombre es requerido', 'error');
        return;
    }

    try {
        await actualizarZona(window.editMode.id, nombre, descripcion);
        mostrarMensaje('✅ Zona actualizada exitosamente', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
        // Resetear formulario
        window.editMode = { tipo: null, id: null };
        document.getElementById('formZona').onsubmit = guardarZona;
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevaZona h3');
        if (tituloModal) {
            tituloModal.textContent = '📍 Registrar Zona';
        }
    } catch (error) {
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function confirmarEliminarZona(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar esta zona?\n\nEsta acción no se puede deshacer.')) {
        try {
            await eliminarZona(id);
            mostrarMensaje('✅ Zona eliminada correctamente', 'success');
            await cargarZonas();
            await cargarEstadisticas();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

// ============================================
// DISTRITOS - Editar/Eliminar
// ============================================
async function editarDistrito(id) {
    try {
        const { data, error } = await window.db
            .from('distritos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Cargar zonas para el select
        const zonas = await obtenerZonas();
        actualizarSelectZonas(zonas);
        
        // Llenar modal
        document.getElementById('distritoZona').value = data.zona_id;
        document.getElementById('distritoNombre').value = data.nombre;
        document.getElementById('distritoResponsable').value = data.responsable || '';
        document.getElementById('distritoTelefono').value = data.telefono || '';
        
        // Configurar edición
        window.editMode = { tipo: 'distrito', id: id };
        document.getElementById('formDistrito').onsubmit = guardarDistritoEditado;
        
        abrirModal('modalNuevoDistrito');
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoDistrito h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Distrito';
        }
        
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarDistritoEditado(e) {
    e.preventDefault();
    const zona_id = document.getElementById('distritoZona').value;
    const nombre = document.getElementById('distritoNombre').value;
    const responsable = document.getElementById('distritoResponsable').value;
    const telefono = document.getElementById('distritoTelefono').value;
    if (!zona_id || !nombre) {
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await actualizarDistrito(window.editMode.id, zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito actualizado', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
        window.editMode = { tipo: null, id: null };
        document.getElementById('formDistrito').onsubmit = guardarDistrito;
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoDistrito h3');
        if (tituloModal) {
            tituloModal.textContent = '🏛️ Registrar Distrito';
        }
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarDistrito(id) {
    if (confirm('⚠️ ¿Eliminar este distrito?\n\nSe eliminarán también las iglesias asociadas.')) {
        try {
            await eliminarDistrito(id);
            mostrarMensaje('✅ Distrito eliminado', 'success');
            await cargarDistritos();
            await cargarEstadisticas();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

// ============================================
// IGLESIAS - Editar/Eliminar
// ============================================
async function editarIglesia(id) {
    try {
        const { data, error } = await window.db
            .from('iglesias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Cargar selects
        const zonas = await obtenerZonas();
        const distritos = await obtenerDistritos();
        actualizarSelectZonas(zonas);
        actualizarSelectDistritos(distritos);
        
        // Llenar formulario
        document.getElementById('iglesiaZona').value = data.zona_id;
        document.getElementById('iglesiaDistrito').value = data.distrito_id || '';
        document.getElementById('iglesiaNombre').value = data.nombre;
        document.getElementById('iglesiaPastor').value = data.pastor || '';
        document.getElementById('iglesiaDireccion').value = data.direccion || '';
        document.getElementById('iglesiaTelefono').value = data.telefono || '';
        
        // Configurar edición
        window.editMode = { tipo: 'iglesia', id: id };
        document.getElementById('formIglesia').onsubmit = guardarIglesiaEditada;
        
        abrirModal('modalNuevaIglesia');
        // CORREGIDO - Esta es la línea que causaba tu error
        const tituloModal = document.querySelector('#modalNuevaIglesia h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Iglesia';
        }
        
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarIglesiaEditada(e) {
    e.preventDefault();
    const zona_id = document.getElementById('iglesiaZona').value;
    const distrito_id = document.getElementById('iglesiaDistrito').value || null;
    const nombre = document.getElementById('iglesiaNombre').value;
    const pastor = document.getElementById('iglesiaPastor').value;
    const direccion = document.getElementById('iglesiaDireccion').value;
    const telefono = document.getElementById('iglesiaTelefono').value;
    if (!zona_id || !nombre) {
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await actualizarIglesia(window.editMode.id, zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia actualizada', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
        window.editMode = { tipo: null, id: null };
        document.getElementById('formIglesia').onsubmit = guardarIglesia;
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevaIglesia h3');
        if (tituloModal) {
            tituloModal.textContent = '⛪ Registrar Iglesia';
        }
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarIglesia(id) {
    if (confirm('⚠️ ¿Eliminar esta iglesia?\n\nEsta acción no se puede deshacer.')) {
        try {
            await eliminarIglesia(id);
            mostrarMensaje('✅ Iglesia eliminada', 'success');
            await cargarIglesias();
            await cargarEstadisticas();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

// ============================================
// CONFERENCIAS - Editar/Eliminar
// ============================================
async function editarConferencia(id) {
    try {
        const { data, error } = await window.db
            .from('conferencias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Cargar iglesias
        const iglesias = await obtenerIglesias();
        actualizarSelectIglesias(iglesias);
        
        // Llenar formulario - CORREGIDO: Usar fechaISOaLocal
        document.getElementById('confIglesia').value = data.iglesia_id;
        document.getElementById('confNombre').value = data.nombre;
        document.getElementById('confFechaInicio').value = fechaISOaLocal(data.fecha_inicio);
        document.getElementById('confFechaFin').value = fechaISOaLocal(data.fecha_fin);
        document.getElementById('confConferenciante').value = data.conferenciante || '';
        
        // Actualizar duración
        actualizarDuracionConferencia();
        
        // Configurar edición
        window.editMode = { tipo: 'conferencia', id: id };
        document.getElementById('formConferencia').onsubmit = guardarConferenciaEditada;
        
        abrirModal('modalNuevaConferencia');
        
        const tituloModal = document.querySelector('#modalNuevaConferencia h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Conferencia';
        }
        
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarConferencia(e) {
    e.preventDefault();
    
    const iglesia_id = document.getElementById('confIglesia').value;
    const nombre = document.getElementById('confNombre').value;
    const fecha_inicio = document.getElementById('confFechaInicio').value;
    const fecha_fin = document.getElementById('confFechaFin').value;
    const conferenciante = document.getElementById('confConferenciante').value;
    
    if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) {
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia creada exitosamente', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        
        // Resetear formulario
        document.getElementById('formConferencia').reset();
        
    } catch (error) {
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function confirmarEliminarConferencia(id) {
    if (confirm('⚠️ ¿Eliminar esta conferencia?\n\nTambién se eliminarán los asistentes registrados.')) {
        try {
            await eliminarConferencia(id);
            mostrarMensaje('✅ Conferencia eliminada', 'success');
            await cargarConferencias();
            await cargarEstadisticas();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

async function cargarConferencias() {
    try {
        const conferencias = await obtenerConferencias();
        const tbody = document.querySelector('#tablaConferencias tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (conferencias && conferencias.length > 0) {
            conferencias.forEach(conf => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${conf.nombre}</td>
                    <td>${conf.iglesias?.nombre || 'Sin iglesia'}</td>
                    <td>${formatearFechaParaTabla(conf.fecha_inicio)}</td>
                    <td>${formatearFechaParaTabla(conf.fecha_fin)}</td>
                    <td>${calcularDias(conf.fecha_inicio, conf.fecha_fin)} días</td>
                    <td>${conf.conferenciante || '-'}</td>
                    <td>
                        <button onclick="editarConferencia(${conf.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarConferencia(${conf.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">Sin conferencias registradas</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando conferencias:', error);
    }
}

// ============================================
// ASISTENTES - Editar/Eliminar
// ============================================
async function editarAsistente(id) {
    try {
        const { data, error } = await window.db
            .from('asistentes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Cargar selects
        const iglesias = await obtenerIglesias();
        const conferencias = await obtenerConferencias();
        actualizarSelectIglesias(iglesias);
        actualizarSelectConferencias(conferencias);
        
        // Llenar formulario
        document.getElementById('asistNombre').value = data.nombre_completo;
        document.getElementById('asistDireccion').value = data.direccion || '';
        document.getElementById('asistTelefono').value = data.telefono || '';
        document.getElementById('asistInvitadoPor').value = data.invitado_por || '';
        document.getElementById('asistIglesia').value = data.iglesia_id || '';
        document.getElementById('asistConferencia').value = data.conferencia_id;
        
        // Configurar edición
        window.editMode = { tipo: 'asistente', id: id };
        document.getElementById('formAsistente').onsubmit = guardarAsistenteEditado;
        
        abrirModal('modalNuevoAsistente');
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoAsistente h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Asistente';
        }
        
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarAsistenteEditado(e) {
    e.preventDefault();
    const datos = {
        nombre_completo: document.getElementById('asistNombre').value,
        direccion: document.getElementById('asistDireccion').value,
        telefono: document.getElementById('asistTelefono').value,
        invitado_por: document.getElementById('asistInvitadoPor').value,
        iglesia_id: document.getElementById('asistIglesia').value || null,
        conferencia_id: document.getElementById('asistConferencia').value
    };
    if (!datos.nombre_completo || !datos.conferencia_id) {
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await actualizarAsistente(window.editMode.id, datos);
        mostrarMensaje('✅ Asistente actualizado', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        window.editMode = { tipo: null, id: null };
        document.getElementById('formAsistente').onsubmit = guardarAsistente;
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoAsistente h3');
        if (tituloModal) {
            tituloModal.textContent = '👥 Nuevo Registro';
        }
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarAsistente(id) {
    if (confirm('⚠️ ¿Eliminar este registro de asistente?')) {
        try {
            await eliminarAsistente(id);
            mostrarMensaje('✅ Registro eliminado', 'success');
            await cargarAsistentes();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

// ============================================
// USUARIOS - Editar/Eliminar
// ============================================
async function editarUsuario(id) {
    try {
        const { data, error } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Llenar formulario
        document.getElementById('usuarioNombreCompleto').value = data.nombre_completo;
        document.getElementById('usuarioEmail').value = data.email;
        document.getElementById('usuarioPassword').value = ''; // No mostrar contraseña
        document.getElementById('usuarioRol').value = data.rol;
        document.getElementById('usuarioEstado').checked = data.estado === 'activo';
        
        // Permisos
        const permisos = JSON.parse(data.permisos || '[]');
        document.querySelectorAll('input[name="permisos"]').forEach(cb => {
            cb.checked = permisos.includes(cb.value);
        });
        
        // Configurar edición
        window.editMode = { tipo: 'usuario', id: id };
        window.tempPassword = '';
        document.getElementById('formUsuario').onsubmit = guardarUsuarioEditado;
        
        abrirModal('modalNuevoUsuario');
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoUsuario h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Usuario';
        }
        
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarUsuarioEditado(e) {
    e.preventDefault();
    const nombre_completo = document.getElementById('usuarioNombreCompleto').value;
    const email = document.getElementById('usuarioEmail').value;
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const estado = document.getElementById('usuarioEstado').checked ? 'activo' : 'inactivo';
    const permisosCheckboxes = document.querySelectorAll('input[name="permisos"]:checked');
    const permisos = Array.from(permisosCheckboxes).map(cb => cb.value);

    if (!nombre_completo || !email) {
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    // Guardar contraseña temporal si se ingresó una nueva
    window.tempPassword = password;

    try {
        await actualizarUsuario(window.editMode.id, nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario actualizado', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        window.editMode = { tipo: null, id: null };
        window.tempPassword = '';
        document.getElementById('formUsuario').onsubmit = guardarUsuario;
        // CORREGIDO
        const tituloModal = document.querySelector('#modalNuevoUsuario h3');
        if (tituloModal) {
            tituloModal.textContent = '👤 Nuevo Usuario';
        }
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarUsuario(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (id === user?.id) {
        mostrarMensaje('❌ No puedes eliminar tu propia cuenta', 'error');
        return;
    }
    if (confirm('⚠️ ¿Eliminar este usuario?\n\nEsta acción no se puede deshacer.')) {
        try {
            await eliminarUsuario(id);
            mostrarMensaje('✅ Usuario eliminado', 'success');
            await cargarUsuarios();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

// ============================================
// UTILIDADES
// ============================================
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear toast temporal
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


// Agregar esta función en main.js
function actualizarDuracionConferencia() {
    const inicio = document.getElementById('confFechaInicio').value;
    const fin = document.getElementById('confFechaFin').value;
    const duracionElement = document.querySelector('#modalNuevaConferencia .duracion-conferencia');
    
    if (inicio && fin && duracionElement) {
        const dias = calcularDias(inicio, fin);
        duracionElement.textContent = `📅 Duración: ${dias} días`;
    }
}

// Agregar listeners para los inputs de fecha
document.addEventListener('DOMContentLoaded', () => {
    const confInicio = document.getElementById('confFechaInicio');
    const confFin = document.getElementById('confFechaFin');
    
    if (confInicio && confFin) {
        confInicio.addEventListener('change', actualizarDuracionConferencia);
        confFin.addEventListener('change', actualizarDuracionConferencia);
    }
});

// Animaciones para toast
const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
document.head.appendChild(style);





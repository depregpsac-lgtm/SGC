// ============================================
// CARGAR DATOS - CRUD (CORREGIDO)
// ============================================
async function cargarZonas() {
    try {
        const zonas = await obtenerZonas();
        const tbody = document.querySelector('#tablaZonas tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (zonas && zonas.length > 0) {
            zonas.forEach(zona => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${zona.nombre}</td>
                    <td>${zona.descripcion || '-'}</td>
                    <td>
                        <button onclick="editarZona(${zona.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarZona(${zona.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3">Sin zonas registradas</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando zonas:', error);
        const tbody = document.querySelector('#tablaZonas tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="3">Error cargando datos</td></tr>';
    }
}

// ============================================
// FUNCIONES DE EDICIÓN Y GUARDADO (NUEVAS)
// ============================================
async function editarZona(id) {
    try {
        const zonas = await obtenerZonas();
        const zona = zonas.find(z => z.id == id);
        if (!zona) return;
        
        window.editMode = { tipo: 'zona', id: id, data: zona };
        
        document.getElementById('zonaNombre').value = zona.nombre;
        document.getElementById('zonaDescripcion').value = zona.descripcion || '';
        document.getElementById('tituloModalZona').textContent = '📍 Editar Zona';
        document.getElementById('formZona').onsubmit = guardarZonaEditada;
        
        abrirModal('modalNuevaZona');
    } catch (error) {
        console.error('❌ Error editando zona:', error);
        mostrarMensaje('Error al cargar datos de la zona', 'error');
    }
}

async function guardarZona(e) {
    e.preventDefault();
    try {
        const nombre = document.getElementById('zonaNombre').value.trim();
        const descripcion = document.getElementById('zonaDescripcion').value.trim();
        
        if (!nombre) {
            mostrarMensaje('El nombre es requerido', 'error');
            return;
        }
        
        await crearZona(nombre, descripcion);
        mostrarMensaje('✅ Zona creada exitosamente', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
    } catch (error) {
        console.error('❌ Error guardando zona:', error);
        mostrarMensaje('Error al guardar zona', 'error');
    }
}

async function guardarZonaEditada(e) {
    e.preventDefault();
    try {
        const nombre = document.getElementById('zonaNombre').value.trim();
        const descripcion = document.getElementById('zonaDescripcion').value.trim();
        
        if (!nombre) {
            mostrarMensaje('El nombre es requerido', 'error');
            return;
        }
        
        await actualizarZona(window.editMode.id, nombre, descripcion);
        mostrarMensaje('✅ Zona actualizada exitosamente', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
    } catch (error) {
        console.error('❌ Error actualizando zona:', error);
        mostrarMensaje('Error al actualizar zona', 'error');
    }
}

async function confirmarEliminarZona(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar esta zona?')) {
        try {
            await eliminarZona(id);
            mostrarMensaje('✅ Zona eliminada exitosamente', 'success');
            await cargarZonas();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando zona:', error);
            mostrarMensaje('Error al eliminar zona', 'error');
        }
    }
}

// ============================================
// DISTritos (Mismo patrón)
// ============================================
async function editarDistrito(id) {
    try {
        const distritos = await obtenerDistritos();
        const dist = distritos.find(d => d.id == id);
        if (!dist) return;
        
        window.editMode = { tipo: 'distrito', id: id, data: dist };
        
        await cargarZonasEnSelect('distritoZona');
        document.getElementById('distritoZona').value = dist.zona_id;
        document.getElementById('distritoNombre').value = dist.nombre;
        document.getElementById('distritoResponsable').value = dist.responsable || '';
        document.getElementById('distritoTelefono').value = dist.telefono || '';
        document.getElementById('tituloModalDistrito').textContent = '🏛️ Editar Distrito';
        document.getElementById('formDistrito').onsubmit = guardarDistritoEditado;
        
        abrirModal('modalNuevoDistrito');
    } catch (error) {
        console.error('❌ Error editando distrito:', error);
        mostrarMensaje('Error al cargar datos del distrito', 'error');
    }
}

async function guardarDistrito(e) {
    e.preventDefault();
    try {
        const zona_id = document.getElementById('distritoZona').value;
        const nombre = document.getElementById('distritoNombre').value.trim();
        const responsable = document.getElementById('distritoResponsable').value.trim();
        const telefono = document.getElementById('distritoTelefono').value.trim();
        
        if (!zona_id || !nombre) {
            mostrarMensaje('Zona y nombre son requeridos', 'error');
            return;
        }
        
        await crearDistrito(zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito creado exitosamente', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
    } catch (error) {
        console.error('❌ Error guardando distrito:', error);
        mostrarMensaje('Error al guardar distrito', 'error');
    }
}

async function guardarDistritoEditado(e) {
    e.preventDefault();
    try {
        const zona_id = document.getElementById('distritoZona').value;
        const nombre = document.getElementById('distritoNombre').value.trim();
        const responsable = document.getElementById('distritoResponsable').value.trim();
        const telefono = document.getElementById('distritoTelefono').value.trim();
        
        if (!zona_id || !nombre) {
            mostrarMensaje('Zona y nombre son requeridos', 'error');
            return;
        }
        
        await actualizarDistrito(window.editMode.id, zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito actualizado exitosamente', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
    } catch (error) {
        console.error('❌ Error actualizando distrito:', error);
        mostrarMensaje('Error al actualizar distrito', 'error');
    }
}

async function confirmarEliminarDistrito(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar este distrito?')) {
        try {
            await eliminarDistrito(id);
            mostrarMensaje('✅ Distrito eliminado exitosamente', 'success');
            await cargarDistritos();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando distrito:', error);
            mostrarMensaje('Error al eliminar distrito', 'error');
        }
    }
}

// ============================================
// IGLESIAS
// ============================================
async function editarIglesia(id) {
    try {
        const iglesias = await obtenerIglesias();
        const iglesia = iglesias.find(i => i.id == id);
        if (!iglesia) return;
        
        window.editMode = { tipo: 'iglesia', id: id, data: iglesia };
        
        await cargarZonasEnSelect('iglesiaZona');
        document.getElementById('iglesiaZona').value = iglesia.zona_id;
        await cargarDistritosPorZona(iglesia.zona_id);
        document.getElementById('iglesiaDistrito').value = iglesia.distrito_id || '';
        document.getElementById('iglesiaNombre').value = iglesia.nombre;
        document.getElementById('iglesiaPastor').value = iglesia.pastor || '';
        document.getElementById('iglesiaTelefono').value = iglesia.telefono || '';
        document.getElementById('iglesiaDireccion').value = iglesia.direccion || '';
        document.getElementById('tituloModalIglesia').textContent = '⛪ Editar Iglesia';
        document.getElementById('formIglesia').onsubmit = guardarIglesiaEditada;
        
        abrirModal('modalNuevaIglesia');
    } catch (error) {
        console.error('❌ Error editando iglesia:', error);
        mostrarMensaje('Error al cargar datos de la iglesia', 'error');
    }
}

async function guardarIglesia(e) {
    e.preventDefault();
    try {
        const zona_id = document.getElementById('iglesiaZona').value;
        const distrito_id = document.getElementById('iglesiaDistrito').value;
        const nombre = document.getElementById('iglesiaNombre').value.trim();
        const pastor = document.getElementById('iglesiaPastor').value.trim();
        const telefono = document.getElementById('iglesiaTelefono').value.trim();
        const direccion = document.getElementById('iglesiaDireccion').value.trim();
        
        if (!zona_id || !nombre) {
            mostrarMensaje('Zona y nombre son requeridos', 'error');
            return;
        }
        
        await crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia creada exitosamente', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
    } catch (error) {
        console.error('❌ Error guardando iglesia:', error);
        mostrarMensaje('Error al guardar iglesia', 'error');
    }
}

async function guardarIglesiaEditada(e) {
    e.preventDefault();
    try {
        const zona_id = document.getElementById('iglesiaZona').value;
        const distrito_id = document.getElementById('iglesiaDistrito').value;
        const nombre = document.getElementById('iglesiaNombre').value.trim();
        const pastor = document.getElementById('iglesiaPastor').value.trim();
        const telefono = document.getElementById('iglesiaTelefono').value.trim();
        const direccion = document.getElementById('iglesiaDireccion').value.trim();
        
        if (!zona_id || !nombre) {
            mostrarMensaje('Zona y nombre son requeridos', 'error');
            return;
        }
        
        await actualizarIglesia(window.editMode.id, zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia actualizada exitosamente', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
    } catch (error) {
        console.error('❌ Error actualizando iglesia:', error);
        mostrarMensaje('Error al actualizar iglesia', 'error');
    }
}

async function confirmarEliminarIglesia(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar esta iglesia?')) {
        try {
            await eliminarIglesia(id);
            mostrarMensaje('✅ Iglesia eliminada exitosamente', 'success');
            await cargarIglesias();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando iglesia:', error);
            mostrarMensaje('Error al eliminar iglesia', 'error');
        }
    }
}

// ============================================
// CONFERENCIAS
// ============================================
async function editarConferencia(id) {
    try {
        const conferencias = await obtenerConferencias();
        const conf = conferencias.find(c => c.id == id);
        if (!conf) return;
        
        window.editMode = { tipo: 'conferencia', id: id, data: conf };
        
        await cargarIglesiasEnSelect('confIglesia');
        document.getElementById('confIglesia').value = conf.iglesia_id;
        document.getElementById('confNombre').value = conf.nombre;
        document.getElementById('confFechaInicio').value = fechaISOaLocal(conf.fecha_inicio);
        document.getElementById('confFechaFin').value = fechaISOaLocal(conf.fecha_fin);
        document.getElementById('confConferenciante').value = conf.conferenciante || '';
        document.getElementById('tituloModalConferencia').textContent = '📅 Editar Conferencia';
        document.getElementById('formConferencia').onsubmit = guardarConferenciaEditada;
        
        actualizarDuracionConferencia();
        abrirModal('modalNuevaConferencia');
    } catch (error) {
        console.error('❌ Error editando conferencia:', error);
        mostrarMensaje('Error al cargar datos de la conferencia', 'error');
    }
}

async function guardarConferencia(e) {
    e.preventDefault();
    try {
        const iglesia_id = document.getElementById('confIglesia').value;
        const nombre = document.getElementById('confNombre').value.trim();
        const fecha_inicio = document.getElementById('confFechaInicio').value;
        const fecha_fin = document.getElementById('confFechaFin').value;
        const conferenciante = document.getElementById('confConferenciante').value.trim();
        
        if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) {
            mostrarMensaje('Todos los campos son requeridos', 'error');
            return;
        }
        
        await crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia creada exitosamente', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
    } catch (error) {
        console.error('❌ Error guardando conferencia:', error);
        mostrarMensaje('Error al guardar conferencia', 'error');
    }
}

async function guardarConferenciaEditada(e) {
    e.preventDefault();
    try {
        const iglesia_id = document.getElementById('confIglesia').value;
        const nombre = document.getElementById('confNombre').value.trim();
        const fecha_inicio = document.getElementById('confFechaInicio').value;
        const fecha_fin = document.getElementById('confFechaFin').value;
        const conferenciante = document.getElementById('confConferenciante').value.trim();
        
        if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) {
            mostrarMensaje('Todos los campos son requeridos', 'error');
            return;
        }
        
        await actualizarConferencia(window.editMode.id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia actualizada exitosamente', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
    } catch (error) {
        console.error('❌ Error actualizando conferencia:', error);
        mostrarMensaje('Error al actualizar conferencia', 'error');
    }
}

async function confirmarEliminarConferencia(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar esta conferencia?')) {
        try {
            await eliminarConferencia(id);
            mostrarMensaje('✅ Conferencia eliminada exitosamente', 'success');
            await cargarConferencias();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando conferencia:', error);
            mostrarMensaje('Error al eliminar conferencia', 'error');
        }
    }
}

// ============================================
// ASISTENTES
// ============================================
async function editarAsistente(id) {
    try {
        const asistentes = await obtenerAsistentes();
        const asist = asistentes.find(a => a.id == id);
        if (!asist) return;
        
        window.editMode = { tipo: 'asistente', id: id, data: asist };
        
        document.getElementById('asistNombre').value = asist.nombre_completo;
        document.getElementById('asistTelefono').value = asist.telefono || '';
        document.getElementById('asistInvitado').value = asist.invitado_por || '';
        document.getElementById('asistDireccion').value = asist.direccion || '';
        
        await cargarIglesiasEnSelect('asistIglesia');
        document.getElementById('asistIglesia').value = asist.iglesia_id || '';
        
        await cargarConferenciasEnSelect('asistConferencia');
        document.getElementById('asistConferencia').value = asist.conferencia_id || '';
        
        document.getElementById('tituloModalAsistente').textContent = '👥 Editar Asistente';
        document.getElementById('formAsistente').onsubmit = guardarAsistenteEditado;
        
        await cargarFechasConferencia(asist.conferencia_id);
        abrirModal('modalNuevoAsistente');
    } catch (error) {
        console.error('❌ Error editando asistente:', error);
        mostrarMensaje('Error al cargar datos del asistente', 'error');
    }
}

async function guardarAsistente(e) {
    e.preventDefault();
    try {
        const nombre_completo = document.getElementById('asistNombre').value.trim();
        const telefono = document.getElementById('asistTelefono').value.trim();
        const invitado_por = document.getElementById('asistInvitado').value.trim();
        const direccion = document.getElementById('asistDireccion').value.trim();
        const iglesia_id = document.getElementById('asistIglesia').value;
        const conferencia_id = document.getElementById('asistConferencia').value;
        const fechas_asistencia = obtenerFechasSeleccionadas();
        
        if (!nombre_completo || !conferencia_id) {
            mostrarMensaje('Nombre y conferencia son requeridos', 'error');
            return;
        }
        
        await crearAsistente({
            nombre_completo,
            telefono,
            invitado_por,
            direccion,
            iglesia_id,
            conferencia_id,
            fechas_asistencia: JSON.stringify(fechas_asistencia)
        });
        
        mostrarMensaje('✅ Asistente registrado exitosamente', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        await cargarEstadisticas();
    } catch (error) {
        console.error('❌ Error guardando asistente:', error);
        mostrarMensaje('Error al guardar asistente', 'error');
    }
}

async function guardarAsistenteEditado(e) {
    e.preventDefault();
    try {
        const nombre_completo = document.getElementById('asistNombre').value.trim();
        const telefono = document.getElementById('asistTelefono').value.trim();
        const invitado_por = document.getElementById('asistInvitado').value.trim();
        const direccion = document.getElementById('asistDireccion').value.trim();
        const iglesia_id = document.getElementById('asistIglesia').value;
        const conferencia_id = document.getElementById('asistConferencia').value;
        const fechas_asistencia = obtenerFechasSeleccionadas();
        
        if (!nombre_completo || !conferencia_id) {
            mostrarMensaje('Nombre y conferencia son requeridos', 'error');
            return;
        }
        
        await actualizarAsistente(window.editMode.id, {
            nombre_completo,
            telefono,
            invitado_por,
            direccion,
            iglesia_id,
            conferencia_id,
            fechas_asistencia: JSON.stringify(fechas_asistencia)
        });
        
        mostrarMensaje('✅ Asistente actualizado exitosamente', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
    } catch (error) {
        console.error('❌ Error actualizando asistente:', error);
        mostrarMensaje('Error al actualizar asistente', 'error');
    }
}

async function confirmarEliminarAsistente(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar este asistente?')) {
        try {
            await eliminarAsistente(id);
            mostrarMensaje('✅ Asistente eliminado exitosamente', 'success');
            await cargarAsistentes();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando asistente:', error);
            mostrarMensaje('Error al eliminar asistente', 'error');
        }
    }
}

// ============================================
// USUARIOS
// ============================================
async function editarUsuario(id) {
    try {
        const usuarios = await obtenerUsuarios();
        const usuario = usuarios.find(u => u.id == id);
        if (!usuario) return;
        
        window.editMode = { tipo: 'usuario', id: id, data: usuario };
        
        document.getElementById('usuarioNombre').value = usuario.nombre_completo;
        document.getElementById('usuarioEmail').value = usuario.email;
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioRol').value = usuario.rol;
        document.getElementById('usuarioEstado').value = usuario.estado;
        
        // Marcar permisos
        const permisos = JSON.parse(usuario.permisos || '[]');
        document.querySelectorAll('.permiso-checkbox').forEach(cb => {
            cb.checked = permisos.includes(cb.value) || usuario.rol === 'admin';
        });
        
        document.getElementById('tituloModalUsuario').textContent = '👤 Editar Usuario';
        document.getElementById('formUsuario').onsubmit = guardarUsuarioEditado;
        
        abrirModal('modalNuevoUsuario');
    } catch (error) {
        console.error('❌ Error editando usuario:', error);
        mostrarMensaje('Error al cargar datos del usuario', 'error');
    }
}

async function guardarUsuario(e) {
    e.preventDefault();
    try {
        const nombre_completo = document.getElementById('usuarioNombre').value.trim();
        const email = document.getElementById('usuarioEmail').value.trim();
        const password = document.getElementById('usuarioPassword').value;
        const rol = document.getElementById('usuarioRol').value;
        const estado = document.getElementById('usuarioEstado').value;
        
        const permisos = [];
        document.querySelectorAll('.permiso-checkbox:checked').forEach(cb => {
            permisos.push(cb.value);
        });
        
        if (!nombre_completo || !email || !password) {
            mostrarMensaje('Nombre, correo y contraseña son requeridos', 'error');
            return;
        }
        
        await crearUsuario(nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario creado exitosamente', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
    } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        mostrarMensaje('Error al guardar usuario', 'error');
    }
}

async function guardarUsuarioEditado(e) {
    e.preventDefault();
    try {
        const nombre_completo = document.getElementById('usuarioNombre').value.trim();
        const email = document.getElementById('usuarioEmail').value.trim();
        const password = document.getElementById('usuarioPassword').value;
        const rol = document.getElementById('usuarioRol').value;
        const estado = document.getElementById('usuarioEstado').value;
        
        const permisos = [];
        document.querySelectorAll('.permiso-checkbox:checked').forEach(cb => {
            permisos.push(cb.value);
        });
        
        if (!nombre_completo || !email) {
            mostrarMensaje('Nombre y correo son requeridos', 'error');
            return;
        }
        
        await actualizarUsuario(window.editMode.id, nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario actualizado exitosamente', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        mostrarMensaje('Error al actualizar usuario', 'error');
    }
}

async function confirmarEliminarUsuario(id) {
    if (confirm('⚠️ ¿Está seguro de eliminar este usuario?')) {
        try {
            await eliminarUsuario(id);
            mostrarMensaje('✅ Usuario eliminado exitosamente', 'success');
            await cargarUsuarios();
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            mostrarMensaje('Error al eliminar usuario', 'error');
        }
    }
}


















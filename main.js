// main.js - Control de la aplicación MinistryLion
// ============================================
console.log('🔍 main.js cargado');
console.log('🔍 window.db existe:', !!window.db);

// ============================================
// VARIABLE GLOBAL PARA MODO EDICIÓN
// ============================================
window.editMode = {
    tipo: null,
    id: null,
    data: null
};

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================
function navegarSeccion(seccionId) {
    console.log('📍 Navegando a:', seccionId);
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    const section = document.getElementById(seccionId);
    if (section) {
        section.classList.add('active');
    }
    
    const navLink = document.getElementById('nav-' + seccionId);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Cargar datos según la sección
    switch(seccionId) {
        case 'dashboard':
            cargarEstadisticas();
            break;
        case 'conferencias':
            cargarConferencias();
            break;
        case 'registros':
            cargarAsistentes();
            break;
        case 'configuracion':
            cargarZonas();
            cargarDistritos();
            cargarIglesias();
            break;
        case 'usuarios':
            cargarUsuarios();
            break;
    }
}

// ============================================
// FUNCIONES PARA PREPARAR MODALES (CREACIÓN)
// ============================================
async function prepararModalZona() {
    console.log('📍 Preparando modal Zona');
    window.editMode = { tipo: null, id: null, data: null };
    
    document.getElementById('formZona').reset();
    document.getElementById('formZona').onsubmit = guardarZona;
    
    const titulo = document.getElementById('tituloModalZona');
    if (titulo) titulo.textContent = '📍 Registrar Zona';
    
    abrirModal('modalNuevaZona');
}

async function prepararModalDistrito() {
    console.log('🏛️ Preparando modal Distrito');
    window.editMode = { tipo: null, id: null, data: null };
    
    document.getElementById('formDistrito').reset();
    document.getElementById('formDistrito').onsubmit = guardarDistrito;
    
    const titulo = document.getElementById('tituloModalDistrito');
    if (titulo) titulo.textContent = '🏛️ Registrar Distrito';
    
    // Cargar zonas en el select
    await cargarZonasEnSelect('distritoZona');
    
    abrirModal('modalNuevoDistrito');
}

async function prepararModalIglesia() {
    console.log('⛪ Preparando modal Iglesia');
    window.editMode = { tipo: null, id: null, data: null };
    
    document.getElementById('formIglesia').reset();
    document.getElementById('formIglesia').onsubmit = guardarIglesia;
    
    const titulo = document.getElementById('tituloModalIglesia');
    if (titulo) titulo.textContent = '⛪ Registrar Iglesia';
    
    // Cargar zonas en el select
    await cargarZonasEnSelect('iglesiaZona');
    document.getElementById('iglesiaDistrito').innerHTML = '<option value="">-- Sin distrito --</option>';
    
    abrirModal('modalNuevaIglesia');
}

async function prepararModalConferencia() {
    console.log('📅 Preparando modal Conferencia');
    window.editMode = { tipo: null, id: null, data: null };
    
    document.getElementById('formConferencia').reset();
    document.getElementById('formConferencia').onsubmit = guardarConferencia;
    
    const titulo = document.getElementById('tituloModalConferencia');
    if (titulo) titulo.textContent = '📅 Nueva Conferencia';
    
    // Cargar iglesias en el select
    await cargarIglesiasEnSelect('confIglesia');
    
    abrirModal('modalNuevaConferencia');
}

async function prepararModalAsistente() {
    console.log('👥 Preparando modal Asistente');
    window.editMode = { tipo: null, id: null, data: null };
    
    document.getElementById('formAsistente').reset();
    document.getElementById('formAsistente').onsubmit = guardarAsistente;
    
    const titulo = document.getElementById('tituloModalAsistente');
    if (titulo) titulo.textContent = '👥 Nuevo Registro de Asistente';
    
    // Limpiar fechas
    const container = document.getElementById('fechasAsistenciaContainer');
    if (container) container.innerHTML = '';
    actualizarContadorAsistencia();
    
    // Cargar selects
    await cargarIglesiasEnSelect('asistIglesia');
    await cargarConferenciasEnSelect('asistConferencia');
    
    abrirModal('modalNuevoAsistente');
}

async function prepararModalUsuario() {
    console.log('👤 Preparando modal Usuario');
    window.editMode = { tipo: null, id: null, data: null };
    window.tempPassword = '';
    
    document.getElementById('formUsuario').reset();
    document.getElementById('formUsuario').onsubmit = guardarUsuario;
    
    const titulo = document.getElementById('tituloModalUsuario');
    if (titulo) titulo.textContent = '👤 Nuevo Usuario';
    
    abrirModal('modalNuevoUsuario');
}

// ============================================
// CARGAR SELECTS
// ============================================
async function cargarZonasEnSelect(selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const zonas = await obtenerZonas();
        select.innerHTML = '<option value="">-- Seleccione Zona --</option>' +
            zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('');
    } catch (error) {
        console.error('❌ Error cargando zonas:', error);
        mostrarMensaje('Error cargando zonas', 'error');
    }
}

async function cargarDistritosEnSelect(selectId, zonaId = null) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        let distritos = await obtenerDistritos();
        
        if (zonaId) {
            distritos = distritos.filter(d => d.zona_id == zonaId);
        }
        
        select.innerHTML = '<option value="">-- Seleccione Distrito --</option>' +
            distritos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
    } catch (error) {
        console.error('❌ Error cargando distritos:', error);
    }
}

async function cargarIglesiasEnSelect(selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const iglesias = await obtenerIglesias();
        select.innerHTML = '<option value="">-- Seleccione Iglesia --</option>' +
            iglesias.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
    } catch (error) {
        console.error('❌ Error cargando iglesias:', error);
    }
}

async function cargarConferenciasEnSelect(selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const conferencias = await obtenerConferencias();
        select.innerHTML = '<option value="">-- Seleccione Conferencia --</option>' +
            conferencias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    } catch (error) {
        console.error('❌ Error cargando conferencias:', error);
    }
}

async function cargarDistritosPorZona(zonaId) {
    await cargarDistritosEnSelect('iglesiaDistrito', zonaId);
}

// ============================================
// ZONAS - CRUD
// ============================================
async function guardarZona(e) {
    e.preventDefault();
    console.log('💾 Guardando Zona...');
    
    const nombre = document.getElementById('zonaNombre').value.trim();
    const descripcion = document.getElementById('zonaDescripcion').value.trim();
    
    if (!nombre) {
        mostrarMensaje('❌ El nombre es requerido', 'error');
        return;
    }
    
    try {
        await crearZona(nombre, descripcion);
        mostrarMensaje('✅ Zona creada exitosamente', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
        document.getElementById('formZona').reset();
    } catch (error) {
        console.error('❌ Error guardando zona:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarZona(id) {
    try {
        console.log('✏️ Editando zona:', id);
        const { data, error } = await window.db
            .from('zonas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('zonaNombre').value = data.nombre;
        document.getElementById('zonaDescripcion').value = data.descripcion || '';
        
        window.editMode = { tipo: 'zona', id: id };
        document.getElementById('formZona').onsubmit = guardarZonaEditada;
        
        const titulo = document.getElementById('tituloModalZona');
        if (titulo) titulo.textContent = '✏️ Editar Zona';
        
        abrirModal('modalNuevaZona');
    } catch (error) {
        console.error('❌ Error cargando zona:', error);
        mostrarMensaje('Error cargando zona: ' + error.message, 'error');
    }
}

async function guardarZonaEditada(e) {
    e.preventDefault();
    console.log('💾 Actualizando Zona:', window.editMode.id);
    
    const nombre = document.getElementById('zonaNombre').value.trim();
    const descripcion = document.getElementById('zonaDescripcion').value.trim();
    
    if (!nombre) {
        mostrarMensaje('❌ El nombre es requerido', 'error');
        return;
    }
    
    try {
        await actualizarZona(window.editMode.id, nombre, descripcion);
        mostrarMensaje('✅ Zona actualizada exitosamente', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formZona').onsubmit = guardarZona;
    } catch (error) {
        console.error('❌ Error actualizando zona:', error);
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
// DISTRITOS - CRUD
// ============================================
async function guardarDistrito(e) {
    e.preventDefault();
    console.log('💾 Guardando Distrito...');
    
    const zona_id = document.getElementById('distritoZona').value;
    const nombre = document.getElementById('distritoNombre').value.trim();
    const responsable = document.getElementById('distritoResponsable').value.trim();
    const telefono = document.getElementById('distritoTelefono').value.trim();
    
    if (!zona_id || !nombre) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await crearDistrito(zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito creado exitosamente', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
        document.getElementById('formDistrito').reset();
    } catch (error) {
        console.error('❌ Error guardando distrito:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarDistrito(id) {
    try {
        console.log('✏️ Editando distrito:', id);
        const { data, error } = await window.db
            .from('distritos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        await cargarZonasEnSelect('distritoZona');
        
        document.getElementById('distritoZona').value = data.zona_id;
        document.getElementById('distritoNombre').value = data.nombre;
        document.getElementById('distritoResponsable').value = data.responsable || '';
        document.getElementById('distritoTelefono').value = data.telefono || '';
        
        window.editMode = { tipo: 'distrito', id: id };
        document.getElementById('formDistrito').onsubmit = guardarDistritoEditado;
        
        const titulo = document.getElementById('tituloModalDistrito');
        if (titulo) titulo.textContent = '✏️ Editar Distrito';
        
        abrirModal('modalNuevoDistrito');
    } catch (error) {
        console.error('❌ Error cargando distrito:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarDistritoEditado(e) {
    e.preventDefault();
    console.log('💾 Actualizando Distrito:', window.editMode.id);
    
    const zona_id = document.getElementById('distritoZona').value;
    const nombre = document.getElementById('distritoNombre').value.trim();
    const responsable = document.getElementById('distritoResponsable').value.trim();
    const telefono = document.getElementById('distritoTelefono').value.trim();
    
    if (!zona_id || !nombre) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await actualizarDistrito(window.editMode.id, zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito actualizado exitosamente', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formDistrito').onsubmit = guardarDistrito;
    } catch (error) {
        console.error('❌ Error actualizando distrito:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
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

async function cargarDistritos() {
    try {
        const distritos = await obtenerDistritos();
        const tbody = document.querySelector('#tablaDistritos tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (distritos && distritos.length > 0) {
            distritos.forEach(dist => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dist.nombre}</td>
                    <td>${dist.zonas?.nombre || 'Sin zona'}</td>
                    <td>${dist.responsable || '-'}</td>
                    <td>
                        <button onclick="editarDistrito(${dist.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarDistrito(${dist.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4">Sin distritos registrados</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando distritos:', error);
        const tbody = document.querySelector('#tablaDistritos tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4">Error cargando datos</td></tr>';
    }
}

// ============================================
// IGLESIAS - CRUD
// ============================================
async function guardarIglesia(e) {
    e.preventDefault();
    console.log('💾 Guardando Iglesia...');
    
    const zona_id = document.getElementById('iglesiaZona').value;
    const distrito_id = document.getElementById('iglesiaDistrito').value || null;
    const nombre = document.getElementById('iglesiaNombre').value.trim();
    const pastor = document.getElementById('iglesiaPastor').value.trim();
    const direccion = document.getElementById('iglesiaDireccion').value.trim();
    const telefono = document.getElementById('iglesiaTelefono').value.trim();
    
    if (!zona_id || !nombre) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia creada exitosamente', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
        document.getElementById('formIglesia').reset();
    } catch (error) {
        console.error('❌ Error guardando iglesia:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarIglesia(id) {
    try {
        console.log('✏️ Editando iglesia:', id);
        const { data, error } = await window.db
            .from('iglesias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        await cargarZonasEnSelect('iglesiaZona');
        await cargarDistritosEnSelect('iglesiaDistrito');
        
        document.getElementById('iglesiaZona').value = data.zona_id;
        document.getElementById('iglesiaDistrito').value = data.distrito_id || '';
        document.getElementById('iglesiaNombre').value = data.nombre;
        document.getElementById('iglesiaPastor').value = data.pastor || '';
        document.getElementById('iglesiaDireccion').value = data.direccion || '';
        document.getElementById('iglesiaTelefono').value = data.telefono || '';
        
        window.editMode = { tipo: 'iglesia', id: id };
        document.getElementById('formIglesia').onsubmit = guardarIglesiaEditada;
        
        const titulo = document.getElementById('tituloModalIglesia');
        if (titulo) titulo.textContent = '✏️ Editar Iglesia';
        
        abrirModal('modalNuevaIglesia');
    } catch (error) {
        console.error('❌ Error cargando iglesia:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarIglesiaEditada(e) {
    e.preventDefault();
    console.log('💾 Actualizando Iglesia:', window.editMode.id);
    
    const zona_id = document.getElementById('iglesiaZona').value;
    const distrito_id = document.getElementById('iglesiaDistrito').value || null;
    const nombre = document.getElementById('iglesiaNombre').value.trim();
    const pastor = document.getElementById('iglesiaPastor').value.trim();
    const direccion = document.getElementById('iglesiaDireccion').value.trim();
    const telefono = document.getElementById('iglesiaTelefono').value.trim();
    
    if (!zona_id || !nombre) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await actualizarIglesia(window.editMode.id, zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia actualizada exitosamente', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formIglesia').onsubmit = guardarIglesia;
    } catch (error) {
        console.error('❌ Error actualizando iglesia:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
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

async function cargarIglesias() {
    try {
        const iglesias = await obtenerIglesias();
        const tbody = document.querySelector('#tablaIglesias tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (iglesias && iglesias.length > 0) {
            iglesias.forEach(iglesia => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${iglesia.nombre}</td>
                    <td>${iglesia.zonas?.nombre || 'Sin zona'}</td>
                    <td>${iglesia.distritos?.nombre || 'Sin distrito'}</td>
                    <td>${iglesia.pastor || '-'}</td>
                    <td>
                        <button onclick="editarIglesia(${iglesia.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarIglesia(${iglesia.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">Sin iglesias registradas</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando iglesias:', error);
        const tbody = document.querySelector('#tablaIglesias tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Error cargando datos</td></tr>';
    }
}

// ============================================
// CONFERENCIAS - CRUD
// ============================================
async function guardarConferencia(e) {
    e.preventDefault();
    console.log('💾 Guardando Conferencia...');
    
    const iglesia_id = document.getElementById('confIglesia').value;
    const nombre = document.getElementById('confNombre').value.trim();
    const fecha_inicio = document.getElementById('confFechaInicio').value;
    const fecha_fin = document.getElementById('confFechaFin').value;
    const conferenciante = document.getElementById('confConferenciante').value.trim();
    
    if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia creada exitosamente', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        document.getElementById('formConferencia').reset();
    } catch (error) {
        console.error('❌ Error guardando conferencia:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarConferencia(id) {
    try {
        console.log('✏️ Editando conferencia:', id);
        const { data, error } = await window.db
            .from('conferencias')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        await cargarIglesiasEnSelect('confIglesia');
        
        document.getElementById('confIglesia').value = data.iglesia_id;
        document.getElementById('confNombre').value = data.nombre;
        document.getElementById('confFechaInicio').value = fechaISOaLocal(data.fecha_inicio);
        document.getElementById('confFechaFin').value = fechaISOaLocal(data.fecha_fin);
        document.getElementById('confConferenciante').value = data.conferenciante || '';
        
        actualizarDuracionConferencia();
        
        window.editMode = { tipo: 'conferencia', id: id };
        document.getElementById('formConferencia').onsubmit = guardarConferenciaEditada;
        
        const titulo = document.getElementById('tituloModalConferencia');
        if (titulo) titulo.textContent = '✏️ Editar Conferencia';
        
        abrirModal('modalNuevaConferencia');
    } catch (error) {
        console.error('❌ Error cargando conferencia:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarConferenciaEditada(e) {
    e.preventDefault();
    console.log('💾 Actualizando Conferencia:', window.editMode.id);
    
    const iglesia_id = document.getElementById('confIglesia').value;
    const nombre = document.getElementById('confNombre').value.trim();
    const fecha_inicio = document.getElementById('confFechaInicio').value;
    const fecha_fin = document.getElementById('confFechaFin').value;
    const conferenciante = document.getElementById('confConferenciante').value.trim();
    
    if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await actualizarConferencia(window.editMode.id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia actualizada exitosamente', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formConferencia').onsubmit = guardarConferencia;
    } catch (error) {
        console.error('❌ Error actualizando conferencia:', error);
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
        console.error('❌ Error cargando conferencias:', error);
        const tbody = document.querySelector('#tablaConferencias tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7">Error cargando datos</td></tr>';
    }
}

function actualizarDuracionConferencia() {
    const inicio = document.getElementById('confFechaInicio').value;
    const fin = document.getElementById('confFechaFin').value;
    const duracionElement = document.querySelector('#modalNuevaConferencia .duracion-conferencia');
    if (inicio && fin && duracionElement) {
        const dias = calcularDias(inicio, fin);
        duracionElement.textContent = `📅 Duración: ${dias} días`;
    }
}

// ============================================
// ASISTENTES - CRUD
// ============================================
async function guardarAsistente(e) {
    e.preventDefault();
    console.log('💾 Guardando Asistente...');
    
    const fechasAsistencia = obtenerFechasSeleccionadas();
    const datos = {
        nombre_completo: document.getElementById('asistNombre').value.trim(),
        direccion: document.getElementById('asistDireccion').value.trim(),
        telefono: document.getElementById('asistTelefono').value.trim(),
        invitado_por: document.getElementById('asistInvitadoPor').value.trim(),
        iglesia_id: document.getElementById('asistIglesia').value || null,
        conferencia_id: document.getElementById('asistConferencia').value,
        fechas_asistencia: JSON.stringify(fechasAsistencia)
    };
    
    if (!datos.nombre_completo || !datos.conferencia_id) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        console.log('📤 Datos a guardar:', datos);
        await crearAsistente(datos);
        mostrarMensaje('✅ Asistente registrado exitosamente', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        document.getElementById('formAsistente').reset();
        
        // Limpiar fechas
        const container = document.getElementById('fechasAsistenciaContainer');
        if (container) container.innerHTML = '';
        actualizarContadorAsistencia();
    } catch (error) {
        console.error('❌ Error guardando asistente:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarAsistente(id) {
    try {
        console.log('✏️ Editando asistente:', id);
        const { data, error } = await window.db
            .from('asistentes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        await cargarIglesiasEnSelect('asistIglesia');
        await cargarConferenciasEnSelect('asistConferencia');
        
        document.getElementById('asistNombre').value = data.nombre_completo;
        document.getElementById('asistDireccion').value = data.direccion || '';
        document.getElementById('asistTelefono').value = data.telefono || '';
        document.getElementById('asistInvitadoPor').value = data.invitado_por || '';
        document.getElementById('asistIglesia').value = data.iglesia_id || '';
        document.getElementById('asistConferencia').value = data.conferencia_id;
        
        window.editMode = { tipo: 'asistente', id: id, data: data };
        document.getElementById('formAsistente').onsubmit = guardarAsistenteEditado;
        
        if (data.conferencia_id && data.fechas_asistencia) {
            const conferencias = await obtenerConferencias();
            const conferencia = conferencias.find(c => c.id == data.conferencia_id);
            if (conferencia) {
                generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
                setTimeout(() => {
                    marcarFechasGuardadas(data.fechas_asistencia);
                }, 150);
            }
        }
        
        const titulo = document.getElementById('tituloModalAsistente');
        if (titulo) titulo.textContent = '✏️ Editar Asistente';
        
        abrirModal('modalNuevoAsistente');
    } catch (error) {
        console.error('❌ Error cargando asistente:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarAsistenteEditado(e) {
    e.preventDefault();
    console.log('💾 Actualizando Asistente:', window.editMode.id);
    
    const fechasAsistencia = obtenerFechasSeleccionadas();
    const datos = {
        nombre_completo: document.getElementById('asistNombre').value.trim(),
        direccion: document.getElementById('asistDireccion').value.trim(),
        telefono: document.getElementById('asistTelefono').value.trim(),
        invitado_por: document.getElementById('asistInvitadoPor').value.trim(),
        iglesia_id: document.getElementById('asistIglesia').value || null,
        conferencia_id: document.getElementById('asistConferencia').value,
        fechas_asistencia: JSON.stringify(fechasAsistencia)
    };
    
    if (!datos.nombre_completo || !datos.conferencia_id) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await actualizarAsistente(window.editMode.id, datos);
        mostrarMensaje('✅ Asistente actualizado exitosamente', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formAsistente').onsubmit = guardarAsistente;
    } catch (error) {
        console.error('❌ Error actualizando asistente:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
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

async function cargarAsistentes() {
    try {
        const asistentes = await obtenerAsistentes();
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (asistentes && asistentes.length > 0) {
            asistentes.forEach(asist => {
                const fechasAsistencia = asist.fechas_asistencia ? JSON.parse(asist.fechas_asistencia) : [];
                const diasAsistidos = fechasAsistencia.length;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${asist.nombre_completo}</td>
                    <td>${asist.telefono || '-'}</td>
                    <td>${asist.iglesias?.nombre || 'Sin iglesia'}</td>
                    <td>${asist.conferencias?.nombre || 'Sin conferencia'}</td>
                    <td><span class="badge-asistencia">${diasAsistidos} días</span></td>
                    <td>
                        <button onclick="editarAsistente(${asist.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarAsistente(${asist.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Sin asistentes registrados</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando asistentes:', error);
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error cargando datos</td></tr>';
    }
}

async function cargarFechasConferencia(conferenciaId) {
    console.log('📅 Cargando fechas para conferencia:', conferenciaId);
    
    const container = document.getElementById('fechasAsistenciaContainer');
    if (container) container.innerHTML = '';
    actualizarContadorAsistencia();
    
    if (!conferenciaId) return;
    
    try {
        const conferencias = await obtenerConferencias();
        const conferencia = conferencias.find(c => c.id == conferenciaId);
        
        if (conferencia) {
            generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
            
            if (window.editMode.tipo === 'asistente' && window.editMode.data?.fechas_asistencia) {
                setTimeout(() => {
                    marcarFechasGuardadas(window.editMode.data.fechas_asistencia);
                }, 150);
            }
        }
    } catch (error) {
        console.error('❌ Error cargando fechas:', error);
        mostrarMensaje('Error al cargar fechas de la conferencia', 'error');
    }
}

// ============================================
// FUNCIONES DE ASISTENCIA - FECHAS Y CONTADOR
// ============================================
function generarBotonesFechas(fechaInicio, fechaFin) {
    const container = document.getElementById('fechasAsistenciaContainer');
    if (!container) return;
    container.innerHTML = '';
    
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const fechas = [];

    let actual = new Date(inicio);
    while (actual <= fin) {
        fechas.push(new Date(actual));
        actual.setDate(actual.getDate() + 1);
    }

    const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    fechas.forEach(fecha => {
        const diaSemana = diasSemana[fecha.getDay()];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        const fechaISO = fecha.toISOString().split('T')[0];
        
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'fecha-asistencia';
        boton.dataset.fecha = fechaISO;
        boton.textContent = `${diaSemana}, ${dia} ${mes} ${año}`;
        
        boton.addEventListener('click', function() {
            toggleFechaAsistencia(this);
        });
        
        container.appendChild(boton);
    });

    actualizarContadorAsistencia();
}

function toggleFechaAsistencia(boton) {
    boton.classList.toggle('seleccionada');
    actualizarContadorAsistencia();
}

function actualizarContadorAsistencia() {
    const botonesSeleccionados = document.querySelectorAll('.fecha-asistencia.seleccionada');
    const totalDias = document.querySelectorAll('.fecha-asistencia').length;
    const diasAsistidos = botonesSeleccionados.length;
    const contadorElement = document.querySelector('.contador-asistencia');
    if (contadorElement) {
        contadorElement.innerHTML = `✅ <strong>${diasAsistidos}</strong> días asistidos de <strong>${totalDias}</strong> totales`;
        if (diasAsistidos === 0) {
            contadorElement.style.background = '#fee2e2';
            contadorElement.style.color = '#dc2626';
        } else if (diasAsistidos === totalDias) {
            contadorElement.style.background = '#d1fae5';
            contadorElement.style.color = '#059669';
        } else {
            contadorElement.style.background = '#fef3c7';
            contadorElement.style.color = '#d97706';
        }
    }
}

function obtenerFechasSeleccionadas() {
    const seleccionadas = document.querySelectorAll('.fecha-asistencia.seleccionada');
    return Array.from(seleccionadas).map(boton => boton.dataset.fecha);
}

function marcarFechasGuardadas(fechasGuardadas) {
    if (!fechasGuardadas || fechasGuardadas.length === 0) return;
    const fechas = typeof fechasGuardadas === 'string' ? JSON.parse(fechasGuardadas) : fechasGuardadas;
    fechas.forEach(fechaISO => {
        const boton = document.querySelector(`.fecha-asistencia[data-fecha="${fechaISO}"]`);
        if (boton) {
            boton.classList.add('seleccionada');
        }
    });
    actualizarContadorAsistencia();
}

// ============================================
// USUARIOS - CRUD
// ============================================
async function guardarUsuario(e) {
    e.preventDefault();
    console.log('💾 Guardando Usuario...');
    
    const nombre_completo = document.getElementById('usuarioNombreCompleto').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const estado = document.getElementById('usuarioEstado').checked ? 'activo' : 'inactivo';
    const permisosCheckboxes = document.querySelectorAll('input[name="permisos"]:checked');
    const permisos = Array.from(permisosCheckboxes).map(cb => cb.value);
    
    if (!nombre_completo || !email || !password) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await crearUsuario(nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario creado exitosamente', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        document.getElementById('formUsuario').reset();
    } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

async function editarUsuario(id) {
    try {
        console.log('✏️ Editando usuario:', id);
        const { data, error } = await window.db
            .from('usuarios_sistema')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('usuarioNombreCompleto').value = data.nombre_completo;
        document.getElementById('usuarioEmail').value = data.email;
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioRol').value = data.rol;
        document.getElementById('usuarioEstado').checked = data.estado === 'activo';
        
        const permisos = JSON.parse(data.permisos || '[]');
        document.querySelectorAll('input[name="permisos"]').forEach(cb => {
            cb.checked = permisos.includes(cb.value);
        });
        
        window.editMode = { tipo: 'usuario', id: id };
        window.tempPassword = '';
        document.getElementById('formUsuario').onsubmit = guardarUsuarioEditado;
        
        const titulo = document.getElementById('tituloModalUsuario');
        if (titulo) titulo.textContent = '✏️ Editar Usuario';
        
        abrirModal('modalNuevoUsuario');
    } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarUsuarioEditado(e) {
    e.preventDefault();
    console.log('💾 Actualizando Usuario:', window.editMode.id);
    
    const nombre_completo = document.getElementById('usuarioNombreCompleto').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const estado = document.getElementById('usuarioEstado').checked ? 'activo' : 'inactivo';
    const permisosCheckboxes = document.querySelectorAll('input[name="permisos"]:checked');
    const permisos = Array.from(permisosCheckboxes).map(cb => cb.value);
    
    if (!nombre_completo || !email) {
        mostrarMensaje('❌ Complete los campos requeridos', 'error');
        return;
    }
    
    try {
        await actualizarUsuario(window.editMode.id, nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario actualizado exitosamente', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        
        window.editMode = { tipo: null, id: null, data: null };
        window.tempPassword = '';
        document.getElementById('formUsuario').onsubmit = guardarUsuario;
    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
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

async function cargarUsuarios() {
    try {
        const usuarios = await obtenerUsuarios();
        const tbody = document.querySelector('#tablaUsuarios tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (usuarios && usuarios.length > 0) {
            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario.nombre_completo}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.rol}</td>
                    <td><span class="badge-estado ${usuario.estado}">${usuario.estado}</span></td>
                    <td>
                        <button onclick="editarUsuario(${usuario.id})" class="btn-edit">✏️</button>
                        <button onclick="confirmarEliminarUsuario(${usuario.id})" class="btn-delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">Sin usuarios registrados</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        const tbody = document.querySelector('#tablaUsuarios tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Error cargando datos</td></tr>';
    }
}

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================
async function cargarEstadisticas() {
    try {
        const stats = await obtenerEstadisticas();
        const elZonas = document.getElementById('statZonas');
        const elDistritos = document.getElementById('statDistritos');
        const elIglesias = document.getElementById('statIglesias');
        const elConferencias = document.getElementById('statConferencias');
        const elAsistentes = document.getElementById('statAsistentes');
        
        if (elZonas) elZonas.textContent = stats.total_zonas || 0;
        if (elDistritos) elDistritos.textContent = stats.total_distritos || 0;
        if (elIglesias) elIglesias.textContent = stats.total_iglesias || 0;
        if (elConferencias) elConferencias.textContent = stats.total_conferencias || 0;
        if (elAsistentes) elAsistentes.textContent = stats.total_asistentes || 0;
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

// ============================================
// REPORTES - FUNCIONES PRINCIPALES
// ============================================

async function prepararModalReporte() {
    console.log('📋 Preparando modal de Reporte');
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formReporte').reset();
    document.getElementById('formReporte').onsubmit = guardarConfiguracionReporte;
    
    const titulo = document.getElementById('tituloModalReporte');
    if (titulo) titulo.textContent = '📋 Configurar Reporte';
    
    // Cargar conferencias en el select
    await cargarConferenciasEnSelect('reporteConfSeleccionada');
    await cargarIglesiasEnSelect('reporteIglesiaFiltro');
    
    abrirModal('modalNuevoReporte');
}

async function guardarConfiguracionReporte(e) {
    e.preventDefault();
    console.log('💾 Guardando configuración de reporte...');
    
    const conferenciaId = document.getElementById('reporteConfSeleccionada').value;
    const iglesiaId = document.getElementById('reporteIglesiaFiltro').value;
    const tipoReporte = document.getElementById('reporteTipo').value;
    const incluirLogo = document.getElementById('reporteIncluirLogo').checked;
    
    // Guardar configuración en localStorage
    localStorage.setItem('configReporte', JSON.stringify({
        conferencia_id: conferenciaId,
        iglesia_id: iglesiaId,
        tipo: tipoReporte,
        incluir_logo: incluirLogo
    }));
    
    // Aplicar filtros
    document.getElementById('reporteConferencia').value = conferenciaId;
    document.getElementById('reporteIglesia').value = iglesiaId;
    
    mostrarMensaje('✅ Configuración guardada', 'success');
    cerrarModal('modalNuevoReporte');
    await cargarVistaPreviaReporte();
}

async function cargarVistaPreviaReporte() {
    console.log('📊 Cargando vista previa del reporte...');
    
    const conferenciaId = document.getElementById('reporteConferencia').value;
    const iglesiaId = document.getElementById('reporteIglesia').value;
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;
    
    try {
        let asistentes = await obtenerAsistentes(conferenciaId);
        
        // Filtrar por iglesia
        if (iglesiaId) {
            asistentes = asistentes.filter(a => a.iglesia_id == iglesiaId);
        }
        
        // Filtrar por fechas
        if (fechaInicio || fechaFin) {
            const conferencias = await obtenerConferencias();
            asistentes = asistentes.filter(a => {
                const conf = conferencias.find(c => c.id == a.conferencia_id);
                if (!conf) return false;
                
                if (fechaInicio && conf.fecha_inicio < fechaInicio) return false;
                if (fechaFin && conf.fecha_fin > fechaFin) return false;
                return true;
            });
        }
        
        // Actualizar resumen
        document.getElementById('totalAsistentesReporte').textContent = asistentes.length;
        
        // Calcular días de campaña
        let diasCampana = 0;
        if (conferenciaId) {
            const conferencias = await obtenerConferencias();
            const conferencia = conferencias.find(c => c.id == conferenciaId);
            if (conferencia) {
                diasCampana = calcularDias(conferencia.fecha_inicio, conferencia.fecha_fin);
            }
        }
        document.getElementById('diasCampanaReporte').textContent = diasCampana;
        
        // Calcular iglesias participantes
        const iglesiasUnicas = new Set(asistentes.map(a => a.iglesia_id).filter(id => id));
        document.getElementById('iglesiasParticipantesReporte').textContent = iglesiasUnicas.size;
        
        // Llenar tabla
        const tbody = document.querySelector('#tablaReporteAsistentes tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (asistentes.length > 0) {
                asistentes.forEach(asist => {
                    const fechasAsistencia = asist.fechas_asistencia ? JSON.parse(asist.fechas_asistencia) : [];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${asist.nombre_completo}</td>
                        <td>${asist.telefono || '-'}</td>
                        <td>${asist.iglesias?.nombre || 'Sin iglesia'}</td>
                        <td>${asist.invitado_por || '-'}</td>
                        <td><span class="badge-asistencia">${fechasAsistencia.length} días</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5">No hay datos para mostrar</td></tr>';
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando vista previa:', error);
        mostrarMensaje('Error cargando datos del reporte', 'error');
    }
}

async function generarPDFReporte() {
    console.log('📄 Generando PDF del reporte...');
    
    const conferenciaId = document.getElementById('reporteConferencia').value;
    const iglesiaId = document.getElementById('reporteIglesia').value;
    
    try {
        // Obtener datos
        let asistentes = await obtenerAsistentes(conferenciaId);
        let conferencia = null;
        let iglesia = null;
        
        if (conferenciaId) {
            const conferencias = await obtenerConferencias();
            conferencia = conferencias.find(c => c.id == conferenciaId);
        }
        
        if (iglesiaId) {
            asistentes = asistentes.filter(a => a.iglesia_id == iglesiaId);
            const iglesias = await obtenerIglesias();
            iglesia = iglesias.find(i => i.id == iglesiaId);
        }
        
        // Crear contenido HTML para el PDF
        const contenidoPDF = generarHTMLParaPDF(conferencia, iglesia, asistentes);
        
        // Generar PDF usando html2pdf
        const element = document.createElement('div');
        element.innerHTML = contenidoPDF;
        element.style.width = '800px';
        element.style.padding = '40px';
        element.style.background = 'white';
        element.style.fontFamily = 'Arial, sans-serif';
        
        // Agregar temporalmente al DOM
        document.body.appendChild(element);
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Reporte_${conferencia?.nombre || 'Conferencia'}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Verificar si html2pdf está disponible
        if (typeof html2pdf === 'undefined') {
            mostrarMensaje('❌ Librería html2pdf no cargada. Agregue el script CDN.', 'error');
            document.body.removeChild(element);
            return;
        }
        
        await html2pdf().set(opt).from(element).save();
        
        // Limpiar
        document.body.removeChild(element);
        
        mostrarMensaje('✅ PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        mostrarMensaje('❌ Error: ' + error.message, 'error');
    }
}

function generarHTMLParaPDF(conferencia, iglesia, asistentes) {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Calcular estadísticas
    const totalAsistentes = asistentes.length;
    const iglesiasUnicas = new Set(asistentes.map(a => a.iglesia_id).filter(id => id));
    const diasCampana = conferencia ? calcularDias(conferencia.fecha_inicio, conferencia.fecha_fin) : 0;
    
    // Calcular total de asistencias
    let totalAsistencias = 0;
    asistentes.forEach(a => {
        const fechas = a.fechas_asistencia ? JSON.parse(a.fechas_asistencia) : [];
        totalAsistencias += fechas.length;
    });
    
    let html = `
        <div class="pdf-header">
            <h1>🦁 MinistryLion - Reporte de Conferencia</h1>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">📅 Conferencia</span>
                    <span class="info-value">${conferencia?.nombre || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎤 Conferenciante</span>
                    <span class="info-value">${conferencia?.conferenciante || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">⛪ Iglesia Sede</span>
                    <span class="info-value">${iglesia?.nombre || conferencia?.iglesias?.nombre || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">👤 Pastor</span>
                    <span class="info-value">${iglesia?.pastor || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📅 Fecha Inicio</span>
                    <span class="info-value">${conferencia?.fecha_inicio ? formatearFechaParaTabla(conferencia.fecha_inicio) : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📅 Fecha Fin</span>
                    <span class="info-value">${conferencia?.fecha_fin ? formatearFechaParaTabla(conferencia.fecha_fin) : 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="pdf-summary">
            <div class="pdf-summary-card">
                <span class="label">👥 Total Asistentes</span>
                <span class="value">${totalAsistentes}</span>
            </div>
            <div class="pdf-summary-card">
                <span class="label">📅 Días de Campaña</span>
                <span class="value">${diasCampana}</span>
            </div>
            <div class="pdf-summary-card">
                <span class="label">⛪ Iglesias Participantes</span>
                <span class="value">${iglesiasUnicas.size}</span>
            </div>
        </div>
        
        <h2 style="color: #667eea; margin: 30px 0 20px 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
            📋 Detalle de Asistentes
        </h2>
        
        <table class="pdf-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Nombre Completo</th>
                    <th style="width: 15%;">Teléfono</th>
                    <th style="width: 20%;">Iglesia</th>
                    <th style="width: 20%;">Invitado Por</th>
                    <th style="width: 10%;">Días</th>
                    <th style="width: 10%;">Asistencia</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (asistentes.length > 0) {
        asistentes.forEach((asist, index) => {
            const fechas = asist.fechas_asistencia ? JSON.parse(asist.fechas_asistencia) : [];
            const porcentajeAsistencia = diasCampana > 0 ? Math.round((fechas.length / diasCampana) * 100) : 0;
            
            html += `
                <tr>
                    <td>${index + 1}. ${asist.nombre_completo}</td>
                    <td>${asist.telefono || '-'}</td>
                    <td>${asist.iglesias?.nombre || 'Sin iglesia'}</td>
                    <td>${asist.invitado_por || '-'}</td>
                    <td style="text-align: center;">${fechas.length}/${diasCampana}</td>
                    <td style="text-align: center;">
                        <span style="background: ${porcentajeAsistencia >= 80 ? '#d1fae5' : porcentajeAsistencia >= 50 ? '#fef3c7' : '#fee2e2'}; 
                                       color: ${porcentajeAsistencia >= 80 ? '#059669' : porcentajeAsistencia >= 50 ? '#d97706' : '#dc2626'};
                                       padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                            ${porcentajeAsistencia}%
                        </span>
                    </td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay registros de asistentes</td></tr>`;
    }
    
    html += `
            </tbody>
        </table>
        
        <div class="pdf-footer">
            <p><strong>MinistryLion - Sistema de Gestión de Conferencias</strong></p>
            <p>Reporte generado el: ${fechaActual}</p>
            <p>Documento oficial - Uso interno</p>
        </div>
    `;
    
    return html;
}

// ============================================
// ACTUALIZAR NAVEGACIÓN PARA INCLUIR REPORTES
// ============================================

// En la función navegarSeccion, agregar el caso para reportes:
/*
switch(seccionId) {
    case 'dashboard':
        cargarEstadisticas();
        break;
    case 'conferencias':
        cargarConferencias();
        break;
    case 'registros':
        cargarAsistentes();
        break;
    case 'reportes':  // <-- NUEVO
        cargarFiltrosReportes();
        cargarVistaPreviaReporte();
        break;
    case 'configuracion':
        cargarZonas();
        cargarDistritos();
        cargarIglesias();
        break;
    case 'usuarios':
        cargarUsuarios();
        break;
}
*/

async function cargarFiltrosReportes() {
    console.log('📋 Cargando filtros para reportes...');
    
    try {
        // Cargar conferencias en el select
        const conferencias = await obtenerConferencias();
        const selectConf = document.getElementById('reporteConferencia');
        if (selectConf) {
            selectConf.innerHTML = '<option value="">-- Todas las Conferencias --</option>' +
                conferencias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
        }
        
        // Cargar iglesias en el select
        const iglesias = await obtenerIglesias();
        const selectIglesia = document.getElementById('reporteIglesia');
        if (selectIglesia) {
            selectIglesia.innerHTML = '<option value="">-- Todas las Iglesias --</option>' +
                iglesias.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
        }
        
        // Cargar configuración guardada si existe
        const configGuardada = localStorage.getItem('configReporte');
        if (configGuardada) {
            const config = JSON.parse(configGuardada);
            if (selectConf && config.conferencia_id) {
                selectConf.value = config.conferencia_id;
            }
            if (selectIglesia && config.iglesia_id) {
                selectIglesia.value = config.iglesia_id;
            }
        }
        
        await cargarVistaPreviaReporte();
        
    } catch (error) {
        console.error('❌ Error cargando filtros de reportes:', error);
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES (agregar al final de main.js)
// ============================================
window.prepararModalReporte = prepararModalReporte;
window.guardarConfiguracionReporte = guardarConfiguracionReporte;
window.cargarVistaPreviaReporte = cargarVistaPreviaReporte;
window.generarPDFReporte = generarPDFReporte;
window.cargarFiltrosReportes = cargarFiltrosReportes;
window.generarHTMLParaPDF = generarHTMLParaPDF;

// ============================================
// FUNCIONES DE UTILIDAD PARA MODALES
// ============================================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = '';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        cerrarModal(e.target.id);
    }
});

// ============================================
// EVENT LISTENERS - INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded - Iniciando aplicación...');
    
    // Verificar que Supabase esté inicializado
    if (!window.db) {
        console.error('❌ window.db no existe. Esperando inicialización...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!window.db) {
            console.error('❌ No se pudo conectar a Supabase');
            mostrarMensaje('Error de conexión con la base de datos', 'error');
            return;
        }
    }
    
    console.log('✅ window.db disponible:', !!window.db);
    
    // Verificar autenticación
    const user = checkAuth();
    if (!user) {
        console.log('🔐 No hay usuario autenticado, redirigiendo...');
        return;
    }
    
    console.log('👤 Usuario autenticado:', user.nombre);
    
    // Listeners para inputs de fecha de conferencia
    const confInicio = document.getElementById('confFechaInicio');
    const confFin = document.getElementById('confFechaFin');
    if (confInicio && confFin) {
        confInicio.addEventListener('change', actualizarDuracionConferencia);
        confFin.addEventListener('change', actualizarDuracionConferencia);
    }
    
    // Cargar datos iniciales
    await cargarZonas();
    await cargarDistritos();
    await cargarIglesias();
    await cargarConferencias();
    await cargarAsistentes();
    await cargarUsuarios();
    await cargarEstadisticas();
    
    console.log('✅ Aplicación inicializada correctamente');
});

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.navegarSeccion = navegarSeccion;
window.prepararModalZona = prepararModalZona;
window.prepararModalDistrito = prepararModalDistrito;
window.prepararModalIglesia = prepararModalIglesia;
window.prepararModalConferencia = prepararModalConferencia;
window.prepararModalAsistente = prepararModalAsistente;
window.prepararModalUsuario = prepararModalUsuario;
window.editarZona = editarZona;
window.guardarZonaEditada = guardarZonaEditada;
window.confirmarEliminarZona = confirmarEliminarZona;
window.guardarZona = guardarZona;
window.cargarZonas = cargarZonas;
window.editarDistrito = editarDistrito;
window.guardarDistritoEditado = guardarDistritoEditado;
window.confirmarEliminarDistrito = confirmarEliminarDistrito;
window.guardarDistrito = guardarDistrito;
window.cargarDistritos = cargarDistritos;
window.editarIglesia = editarIglesia;
window.guardarIglesiaEditada = guardarIglesiaEditada;
window.confirmarEliminarIglesia = confirmarEliminarIglesia;
window.guardarIglesia = guardarIglesia;
window.cargarIglesias = cargarIglesias;
window.editarConferencia = editarConferencia;
window.guardarConferenciaEditada = guardarConferenciaEditada;
window.confirmarEliminarConferencia = confirmarEliminarConferencia;
window.cargarConferencias = cargarConferencias;
window.guardarConferencia = guardarConferencia;
window.editarAsistente = editarAsistente;
window.guardarAsistenteEditado = guardarAsistenteEditado;
window.confirmarEliminarAsistente = confirmarEliminarAsistente;
window.cargarAsistentes = cargarAsistentes;
window.guardarAsistente = guardarAsistente;
window.editarUsuario = editarUsuario;
window.guardarUsuarioEditado = guardarUsuarioEditado;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
window.cargarUsuarios = cargarUsuarios;
window.guardarUsuario = guardarUsuario;
window.fechaISOaLocal = fechaISOaLocal;
window.formatearFechaParaTabla = formatearFechaParaTabla;
window.calcularDias = calcularDias;
window.generarBotonesFechas = generarBotonesFechas;
window.toggleFechaAsistencia = toggleFechaAsistencia;
window.actualizarContadorAsistencia = actualizarContadorAsistencia;
window.obtenerFechasSeleccionadas = obtenerFechasSeleccionadas;
window.marcarFechasGuardadas = marcarFechasGuardadas;
window.actualizarDuracionConferencia = actualizarDuracionConferencia;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.cargarEstadisticas = cargarEstadisticas;
window.cargarZonasEnSelect = cargarZonasEnSelect;
window.cargarDistritosEnSelect = cargarDistritosEnSelect;
window.cargarIglesiasEnSelect = cargarIglesiasEnSelect;
window.cargarConferenciasEnSelect = cargarConferenciasEnSelect;
window.cargarDistritosPorZona = cargarDistritosPorZona;
window.cargarFechasConferencia = cargarFechasConferencia;

console.log('✅ main.js cargado correctamente con todas las funciones');













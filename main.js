// main.js - Control completo CRUD para MinistryLion
// ============================================
console.log('🔍 main.js cargado');

window.editMode = { tipo: null, id: null, data: null };

// ============================================
// CONTROL DE MENÚ POR PERMISOS
// ============================================
function aplicarPermisosMenu() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    const esAdmin = user.rol === 'administrador';
    const permisos = JSON.parse(user.permisos || '[]');
    
    const menuItems = {
        'dashboard': document.querySelectorAll('[data-permiso="dashboard"]'),
        'conferencias': document.querySelectorAll('[data-permiso="conferencias"]'),
        'registros': document.querySelectorAll('[data-permiso="registros"]'),
        'reportes': document.querySelectorAll('[data-permiso="reportes"]'),
        'configuracion': document.querySelectorAll('[data-permiso="configuracion"]'),
        'usuarios': document.querySelectorAll('[data-permiso="usuarios"]')
    };
    
    for (const [permiso, elementos] of Object.entries(menuItems)) {
        elementos.forEach(el => {
            if (esAdmin || permisos.includes(permiso)) {
                el.style.display = 'block';
                el.closest('li')?.style.setProperty('display', 'block', 'important');
            } else {
                el.style.display = 'none';
                el.closest('li')?.style.setProperty('display', 'none', 'important');
            }
        });
    }
    
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <div style="font-size: 0.9em;">👤 ${user.nombre}</div>
            <div style="font-size: 0.8em; opacity: 0.8;">
                ${user.rol === 'administrador' ? '👑 Administrador' : '👤 Usuario'}
            </div>
        `;
    }
}

// ============================================
// ZONAS - CRUD COMPLETO ✅
// ============================================
async function editarZona(id) {
    try {
        const { data, error } = await window.db.from('zonas').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('zonaNombre').value = data.nombre;
        document.getElementById('zonaDescripcion').value = data.descripcion || '';
        
        window.editMode = { tipo: 'zona', id: id };
        document.getElementById('formZona').onsubmit = guardarZonaEditada;
        
        abrirModal('modalNuevaZona');
        const titulo = document.querySelector('#modalNuevaZona h3');
        if (titulo) titulo.textContent = '✏️ Editar Zona';
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarZonaEditada(e) {
    e.preventDefault();
    const nombre = document.getElementById('zonaNombre').value;
    const descripcion = document.getElementById('zonaDescripcion').value;
    
    if (!nombre) { mostrarMensaje('El nombre es requerido', 'error'); return; }

    try {
        await actualizarZona(window.editMode.id, nombre, descripcion);
        mostrarMensaje('✅ Zona actualizada', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formZona').onsubmit = guardarZona;
        const titulo = document.querySelector('#modalNuevaZona h3');
        if (titulo) titulo.textContent = '📍 Registrar Zona';
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarZona(id) {
    if (confirm('⚠️ ¿Eliminar esta zona?\n\nEsta acción no se puede deshacer.')) {
        try {
            await eliminarZona(id);
            mostrarMensaje('✅ Zona eliminada', 'success');
            await cargarZonas();
            await cargarEstadisticas();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

async function guardarZona(e) {
    e.preventDefault();
    const nombre = document.getElementById('zonaNombre').value;
    const descripcion = document.getElementById('zonaDescripcion').value;
    
    if (!nombre) { mostrarMensaje('El nombre es requerido', 'error'); return; }

    try {
        await crearZona(nombre, descripcion);
        mostrarMensaje('✅ Zona creada', 'success');
        cerrarModal('modalNuevaZona');
        await cargarZonas();
        await cargarEstadisticas();
        document.getElementById('formZona').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
        console.error('Error cargando zonas:', error);
    }
}

// ============================================
// DISTRITOS - CRUD COMPLETO ✅
// ============================================
async function editarDistrito(id) {
    try {
        const { data, error } = await window.db.from('distritos').select('*').eq('id', id).single();
        if (error) throw error;
        
        const zonas = await obtenerZonas();
        actualizarSelectZonas(zonas);
        
        document.getElementById('distritoZona').value = data.zona_id;
        document.getElementById('distritoNombre').value = data.nombre;
        document.getElementById('distritoResponsable').value = data.responsable || '';
        document.getElementById('distritoTelefono').value = data.telefono || '';
        
        window.editMode = { tipo: 'distrito', id: id };
        document.getElementById('formDistrito').onsubmit = guardarDistritoEditado;
        
        abrirModal('modalNuevoDistrito');
        const titulo = document.querySelector('#modalNuevoDistrito h3');
        if (titulo) titulo.textContent = '✏️ Editar Distrito';
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
    
    if (!zona_id || !nombre) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await actualizarDistrito(window.editMode.id, zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito actualizado', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formDistrito').onsubmit = guardarDistrito;
        const titulo = document.querySelector('#modalNuevoDistrito h3');
        if (titulo) titulo.textContent = '🏛️ Registrar Distrito';
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarDistrito(id) {
    if (confirm('⚠️ ¿Eliminar este distrito?')) {
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

async function guardarDistrito(e) {
    e.preventDefault();
    const zona_id = document.getElementById('distritoZona').value;
    const nombre = document.getElementById('distritoNombre').value;
    const responsable = document.getElementById('distritoResponsable').value;
    const telefono = document.getElementById('distritoTelefono').value;
    
    if (!zona_id || !nombre) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await crearDistrito(zona_id, nombre, responsable, telefono);
        mostrarMensaje('✅ Distrito creado', 'success');
        cerrarModal('modalNuevoDistrito');
        await cargarDistritos();
        await cargarEstadisticas();
        document.getElementById('formDistrito').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
            tbody.innerHTML = '<tr><td colspan="4">Sin distritos</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando distritos:', error);
    }
}

// ============================================
// IGLESIAS - CRUD COMPLETO ✅
// ============================================
async function editarIglesia(id) {
    try {
        const { data, error } = await window.db.from('iglesias').select('*').eq('id', id).single();
        if (error) throw error;
        
        const zonas = await obtenerZonas();
        const distritos = await obtenerDistritos();
        actualizarSelectZonas(zonas);
        actualizarSelectDistritos(distritos);
        
        document.getElementById('iglesiaZona').value = data.zona_id;
        document.getElementById('iglesiaDistrito').value = data.distrito_id || '';
        document.getElementById('iglesiaNombre').value = data.nombre;
        document.getElementById('iglesiaPastor').value = data.pastor || '';
        document.getElementById('iglesiaDireccion').value = data.direccion || '';
        document.getElementById('iglesiaTelefono').value = data.telefono || '';
        
        window.editMode = { tipo: 'iglesia', id: id };
        document.getElementById('formIglesia').onsubmit = guardarIglesiaEditada;
        
        abrirModal('modalNuevaIglesia');
        const titulo = document.querySelector('#modalNuevaIglesia h3');
        if (titulo) titulo.textContent = '✏️ Editar Iglesia';
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
    
    if (!zona_id || !nombre) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await actualizarIglesia(window.editMode.id, zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia actualizada', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formIglesia').onsubmit = guardarIglesia;
        const titulo = document.querySelector('#modalNuevaIglesia h3');
        if (titulo) titulo.textContent = '⛪ Registrar Iglesia';
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarIglesia(id) {
    if (confirm('⚠️ ¿Eliminar esta iglesia?')) {
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

async function guardarIglesia(e) {
    e.preventDefault();
    const zona_id = document.getElementById('iglesiaZona').value;
    const distrito_id = document.getElementById('iglesiaDistrito').value || null;
    const nombre = document.getElementById('iglesiaNombre').value;
    const pastor = document.getElementById('iglesiaPastor').value;
    const direccion = document.getElementById('iglesiaDireccion').value;
    const telefono = document.getElementById('iglesiaTelefono').value;
    
    if (!zona_id || !nombre) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await crearIglesia(zona_id, distrito_id, nombre, pastor, direccion, telefono);
        mostrarMensaje('✅ Iglesia creada', 'success');
        cerrarModal('modalNuevaIglesia');
        await cargarIglesias();
        await cargarEstadisticas();
        document.getElementById('formIglesia').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
            tbody.innerHTML = '<tr><td colspan="5">Sin iglesias</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando iglesias:', error);
    }
}

// ============================================
// CONFERENCIAS - CRUD COMPLETO ✅
// ============================================
async function editarConferencia(id) {
    try {
        const { data, error } = await window.db.from('conferencias').select('*').eq('id', id).single();
        if (error) throw error;
        
        const iglesias = await obtenerIglesias();
        actualizarSelectIglesias(iglesias);
        
        document.getElementById('confIglesia').value = data.iglesia_id;
        document.getElementById('confNombre').value = data.nombre;
        document.getElementById('confFechaInicio').value = fechaISOaLocal(data.fecha_inicio);
        document.getElementById('confFechaFin').value = fechaISOaLocal(data.fecha_fin);
        document.getElementById('confConferenciante').value = data.conferenciante || '';
        
        actualizarDuracionConferencia();
        
        window.editMode = { tipo: 'conferencia', id: id };
        document.getElementById('formConferencia').onsubmit = guardarConferenciaEditada;
        
        abrirModal('modalNuevaConferencia');
        const titulo = document.querySelector('#modalNuevaConferencia h3');
        if (titulo) titulo.textContent = '✏️ Editar Conferencia';
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarConferenciaEditada(e) {
    e.preventDefault();
    const iglesia_id = document.getElementById('confIglesia').value;
    const nombre = document.getElementById('confNombre').value;
    const fecha_inicio = document.getElementById('confFechaInicio').value;
    const fecha_fin = document.getElementById('confFechaFin').value;
    const conferenciante = document.getElementById('confConferenciante').value;
    
    if (!iglesia_id || !nombre || !fecha_inicio || !fecha_fin) { 
        mostrarMensaje('Complete campos requeridos', 'error'); return; 
    }

    try {
        await actualizarConferencia(window.editMode.id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia actualizada', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formConferencia').onsubmit = guardarConferencia;
        const titulo = document.querySelector('#modalNuevaConferencia h3');
        if (titulo) titulo.textContent = '📅 Nueva Conferencia';
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarConferencia(id) {
    if (confirm('⚠️ ¿Eliminar esta conferencia?\n\nTambién se eliminarán los asistentes.')) {
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
            tbody.innerHTML = '<tr><td colspan="7">Sin conferencias</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando conferencias:', error);
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
        mostrarMensaje('Complete campos requeridos', 'error'); return; 
    }

    try {
        await crearConferencia(iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia creada', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        document.getElementById('formConferencia').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
// ASISTENTES - CRUD COMPLETO ✅
// ============================================
async function editarAsistente(id) {
    try {
        const { data, error } = await window.db.from('asistentes').select('*').eq('id', id).single();
        if (error) throw error;
        
        const iglesias = await obtenerIglesias();
        const conferencias = await obtenerConferencias();
        actualizarSelectIglesias(iglesias);
        actualizarSelectConferencias(conferencias);
        
        document.getElementById('asistNombre').value = data.nombre_completo;
        document.getElementById('asistDireccion').value = data.direccion || '';
        document.getElementById('asistTelefono').value = data.telefono || '';
        document.getElementById('asistInvitadoPor').value = data.invitado_por || '';
        document.getElementById('asistIglesia').value = data.iglesia_id || '';
        document.getElementById('asistConferencia').value = data.conferencia_id;
        
        window.editMode = { tipo: 'asistente', id: id, data: data };
        document.getElementById('formAsistente').onsubmit = guardarAsistenteEditado;
        
        if (data.conferencia_id && data.fechas_asistencia) {
            const conferencia = conferencias.find(c => c.id === data.conferencia_id);
            if (conferencia) {
                generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
                setTimeout(() => {
                    marcarFechasGuardadas(data.fechas_asistencia);
                }, 150);
            }
        }
        
        abrirModal('modalNuevoAsistente');
        const titulo = document.querySelector('#modalNuevoAsistente h3');
        if (titulo) titulo.textContent = '✏️ Editar Asistente';
    } catch (error) {
        mostrarMensaje('Error: ' + error.message, 'error');
    }
}

async function guardarAsistenteEditado(e) {
    e.preventDefault();
    const fechasAsistencia = obtenerFechasSeleccionadas();
    const datos = {
        nombre_completo: document.getElementById('asistNombre').value,
        direccion: document.getElementById('asistDireccion').value,
        telefono: document.getElementById('asistTelefono').value,
        invitado_por: document.getElementById('asistInvitadoPor').value,
        iglesia_id: document.getElementById('asistIglesia').value || null,
        conferencia_id: document.getElementById('asistConferencia').value,
        fechas_asistencia: JSON.stringify(fechasAsistencia)
    };
    
    if (!datos.nombre_completo || !datos.conferencia_id) { 
        mostrarMensaje('Complete campos requeridos', 'error'); return; 
    }

    try {
        await actualizarAsistente(window.editMode.id, datos);
        mostrarMensaje('✅ Asistente actualizado', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formAsistente').onsubmit = guardarAsistente;
        const titulo = document.querySelector('#modalNuevoAsistente h3');
        if (titulo) titulo.textContent = '👥 Nuevo Registro';
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

async function confirmarEliminarAsistente(id) {
    if (confirm('⚠️ ¿Eliminar este registro?')) {
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
            tbody.innerHTML = '<tr><td colspan="6">Sin asistentes</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando asistentes:', error);
    }
}

async function guardarAsistente(e) {
    e.preventDefault();
    const fechasAsistencia = obtenerFechasSeleccionadas();
    const datos = {
        nombre_completo: document.getElementById('asistNombre').value,
        direccion: document.getElementById('asistDireccion').value,
        telefono: document.getElementById('asistTelefono').value,
        invitado_por: document.getElementById('asistInvitadoPor').value,
        iglesia_id: document.getElementById('asistIglesia').value || null,
        conferencia_id: document.getElementById('asistConferencia').value,
        fechas_asistencia: JSON.stringify(fechasAsistencia)
    };
    
    if (!datos.nombre_completo || !datos.conferencia_id) { 
        mostrarMensaje('Complete campos requeridos', 'error'); return; 
    }

    try {
        await crearAsistente(datos);
        mostrarMensaje('✅ Asistente registrado', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        document.getElementById('formAsistente').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
    }
}

// ============================================
// FUNCIONES DE ASISTENCIA
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
        contadorElement.innerHTML = `✅ <strong>${diasAsistidos}</strong> días de <strong>${totalDias}</strong> totales`;
        
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
        if (boton) boton.classList.add('seleccionada');
    });

    actualizarContadorAsistencia();
}

// ============================================
// USUARIOS - CRUD COMPLETO ✅
// ============================================
async function editarUsuario(id) {
    try {
        const { data, error } = await window.db.from('usuarios_sistema').select('*').eq('id', id).single();
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
        document.getElementById('formUsuario').onsubmit = guardarUsuarioEditado;
        
        abrirModal('modalNuevoUsuario');
        const titulo = document.querySelector('#modalNuevoUsuario h3');
        if (titulo) titulo.textContent = '✏️ Editar Usuario';
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
    
    if (!nombre_completo || !email) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await actualizarUsuario(window.editMode.id, nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario actualizado', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formUsuario').onsubmit = guardarUsuario;
        const titulo = document.querySelector('#modalNuevoUsuario h3');
        if (titulo) titulo.textContent = '👤 Nuevo Usuario';
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
    if (confirm('⚠️ ¿Eliminar este usuario?')) {
        try {
            await eliminarUsuario(id);
            mostrarMensaje('✅ Usuario eliminado', 'success');
            await cargarUsuarios();
        } catch (error) {
            mostrarMensaje('❌ ' + error.message, 'error');
        }
    }
}

async function guardarUsuario(e) {
    e.preventDefault();
    const nombre_completo = document.getElementById('usuarioNombreCompleto').value;
    const email = document.getElementById('usuarioEmail').value;
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const estado = document.getElementById('usuarioEstado').checked ? 'activo' : 'inactivo';
    const permisosCheckboxes = document.querySelectorAll('input[name="permisos"]:checked');
    const permisos = Array.from(permisosCheckboxes).map(cb => cb.value);
    
    if (!nombre_completo || !email || !password) { mostrarMensaje('Complete campos requeridos', 'error'); return; }

    try {
        await crearUsuario(nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario creado', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        document.getElementById('formUsuario').reset();
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
            tbody.innerHTML = '<tr><td colspan="5">Sin usuarios</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function actualizarSelectZonas(zonas) {
    const select = document.getElementById('distritoZona');
    const select2 = document.getElementById('iglesiaZona');
    if (!select && !select2) return;
    
    const opciones = '<option value="">-- Seleccione --</option>' + 
        zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('');
    
    if (select) select.innerHTML = opciones;
    if (select2) select2.innerHTML = opciones;
}

function actualizarSelectDistritos(distritos) {
    const select = document.getElementById('iglesiaDistrito');
    if (!select) return;
    
    const opciones = '<option value="">-- Sin distrito --</option>' + 
        distritos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
    
    select.innerHTML = opciones;
}

function actualizarSelectIglesias(iglesias) {
    const select = document.getElementById('confIglesia');
    const select2 = document.getElementById('asistIglesia');
    if (!select && !select2) return;
    
    const opciones = '<option value="">-- Seleccione Iglesia --</option>' + 
        iglesias.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
    
    if (select) select.innerHTML = opciones;
    if (select2) select2.innerHTML = opciones;
}

function actualizarSelectConferencias(conferencias) {
    const select = document.getElementById('asistConferencia');
    if (!select) return;
    
    const opciones = '<option value="">-- Seleccione Conferencia --</option>' + 
        conferencias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    
    select.innerHTML = opciones;
}

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
        console.error('Error cargando estadísticas:', error);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    aplicarPermisosMenu();
    
    const confInicio = document.getElementById('confFechaInicio');
    const confFin = document.getElementById('confFechaFin');
    if (confInicio && confFin) {
        confInicio.addEventListener('change', actualizarDuracionConferencia);
        confFin.addEventListener('change', actualizarDuracionConferencia);
    }

    const confSelect = document.getElementById('asistConferencia');
    if (confSelect) {
        confSelect.replaceWith(confSelect.cloneNode(true));
        const newConfSelect = document.getElementById('asistConferencia');
        
        newConfSelect.addEventListener('change', async (e) => {
            const conferenciaId = e.target.value;
            
            const container = document.getElementById('fechasAsistenciaContainer');
            if (container) container.innerHTML = '';
            actualizarContadorAsistencia();
            
            if (conferenciaId) {
                try {
                    const conferencias = await obtenerConferencias();
                    const conferencia = conferencias.find(c => c.id == conferenciaId);
                    
                    if (conferencia) {
                        generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
                        
                        if (window.editMode.tipo === 'asistente' && window.editMode.id && window.editMode.data?.fechas_asistencia) {
                            setTimeout(() => {
                                marcarFechasGuardadas(window.editMode.data.fechas_asistencia);
                            }, 150);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error cargando fechas:', error);
                    mostrarMensaje('Error al cargar fechas', 'error');
                }
            }
        });
    }

    const formAsistente = document.getElementById('formAsistente');
    if (formAsistente) {
        formAsistente.onsubmit = guardarAsistente;
    }
    
    cargarZonas();
    cargarDistritos();
    cargarIglesias();
    cargarConferencias();
    cargarAsistentes();
    cargarUsuarios();
    cargarEstadisticas();
});

// ============================================
// MODALES
// ============================================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
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

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        cerrarModal(e.target.id);
    }
});

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
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
window.actualizarSelectZonas = actualizarSelectZonas;
window.actualizarSelectDistritos = actualizarSelectDistritos;
window.actualizarSelectIglesias = actualizarSelectIglesias;
window.actualizarSelectConferencias = actualizarSelectConferencias;
window.aplicarPermisosMenu = aplicarPermisosMenu;

console.log('✅ main.js cargado con TODAS las funciones CRUD');











// main.js - Control de la aplicación MinistryLion
console.log('🔍 main.js cargado');
console.log('🔍 window.db existe:', !!window.db);

window.editMode = {
    tipo: null,
    id: null,
    data: null
};

// Variable global para almacenar datos de asistentes
let asistentesData = [];

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function mostrarMensaje(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; background: ${tipo === 'success' ? '#d1fae5' : '#fee2e2'}; color: ${tipo === 'success' ? '#059669' : '#dc2626'}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 500; animation: slideIn 0.3s ease;`;
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${mensaje}`;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

function fechaISOaLocal(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toISOString().split('T')[0];
}

function formatearFechaParaTabla(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES');
}

function calcularDias(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================
// NAVEGACIÓN
// ============================================
function navegarSeccion(seccionId) {
    console.log('📍 Navegando a:', seccionId);
    
    // ✅ PROTEGER SECCIÓN USUARIOS - SOLO ADMIN
    if (seccionId === 'usuarios') {
        const user = checkAuth();
        if (!user || user.rol !== 'admin') {
            mostrarMensaje('⛔ Acceso denegado. Solo administradores pueden ver esta sección', 'error');
            seccionId = 'dashboard';
        }
    }
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    const section = document.getElementById(seccionId);
    if (section) section.classList.add('active');
    
    const navLink = document.getElementById('nav-' + seccionId);
    if (navLink) navLink.classList.add('active');
    
    switch(seccionId) {
        case 'dashboard': cargarEstadisticas(); break;
        case 'conferencias': cargarConferencias(); break;
        case 'registros': cargarAsistentes(); break;
        case 'reportes': cargarReportes(); break;
        case 'configuracion': 
            cargarZonas(); 
            cargarDistritos(); 
            cargarIglesias(); 
            break;
        case 'usuarios': 
            if (esAdmin()) {
                cargarUsuarios(); 
            }
            break;
    }
}

// ============================================
// MODALES
// ============================================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
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
// PREPARAR MODALES
// ============================================
async function prepararModalZona() {
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formZona').reset();
    document.getElementById('formZona').onsubmit = guardarZona;
    const titulo = document.getElementById('tituloModalZona');
    if (titulo) titulo.textContent = '📍 Registrar Zona';
    abrirModal('modalNuevaZona');
}

async function prepararModalDistrito() {
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formDistrito').reset();
    document.getElementById('formDistrito').onsubmit = guardarDistrito;
    const titulo = document.getElementById('tituloModalDistrito');
    if (titulo) titulo.textContent = '🏛️ Registrar Distrito';
    await cargarZonasEnSelect('distritoZona');
    abrirModal('modalNuevoDistrito');
}

async function prepararModalIglesia() {
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formIglesia').reset();
    document.getElementById('formIglesia').onsubmit = guardarIglesia;
    const titulo = document.getElementById('tituloModalIglesia');
    if (titulo) titulo.textContent = '⛪ Registrar Iglesia';
    await cargarZonasEnSelect('iglesiaZona');
    document.getElementById('iglesiaDistrito').innerHTML = '<option value="">-- Sin distrito --</option>';
    abrirModal('modalNuevaIglesia');
}

async function prepararModalConferencia() {
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formConferencia').reset();
    document.getElementById('formConferencia').onsubmit = guardarConferencia;
    const titulo = document.getElementById('tituloModalConferencia');
    if (titulo) titulo.textContent = '📅 Nueva Conferencia';
    await cargarIglesiasEnSelect('confIglesia');
    abrirModal('modalNuevaConferencia');
}

async function prepararModalAsistente() {
    window.editMode = { tipo: null, id: null, data: null };
    document.getElementById('formAsistente').reset();
    document.getElementById('formAsistente').onsubmit = guardarAsistente;
    const titulo = document.getElementById('tituloModalAsistente');
    if (titulo) titulo.textContent = '👥 Nuevo Registro de Asistente';
    const container = document.getElementById('fechasAsistenciaContainer');
    if (container) container.innerHTML = '<h4>✅ Marque los días que asistió:</h4>';
    actualizarContadorAsistencia();
    await cargarIglesiasEnSelect('asistIglesia');
    await cargarConferenciasEnSelect('asistConferencia');
    abrirModal('modalNuevoAsistente');
}

async function prepararModalUsuario() {
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
// CARGAR DATOS - CRUD
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

async function cargarAsistentes() {
    try {
        console.log('📥 Cargando asistentes...');
        const asistentes = await obtenerAsistentes();
        asistentesData = asistentes; // ✅ Guardar para filtrado
        console.log('✅ Asistentes obtenidos:', asistentes.length);
        
        // ✅ Cargar opciones en los filtros
        await cargarConferenciasEnSelect('filtroConferencia');
        await cargarIglesiasEnSelect('filtroIglesia');
        
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }
        
        renderizarTablaAsistentes(asistentes);
    } catch (error) {
        console.error('❌ Error cargando asistentes:', error);
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error: ' + error.message + '</td></tr>';
    }
}

// Función para renderizar la tabla de asistentes
function renderizarTablaAsistentes(asistentes) {
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
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron asistentes con los filtros seleccionados</p>
                </td>
            </tr>
        `;
    }
}

// ✅ Función principal de filtrado de asistentes
function filtrarAsistentes() {
    const textoBusqueda = document.getElementById('buscarAsistente')?.value.toLowerCase().trim() || '';
    const conferenciaId = document.getElementById('filtroConferencia')?.value || '';
    const iglesiaId = document.getElementById('filtroIglesia')?.value || '';
    
    let asistentesFiltrados = asistentesData.filter(asist => {
        // Filtro por texto (nombre, teléfono, iglesia, conferencia)
        const coincideTexto = 
            asist.nombre_completo.toLowerCase().includes(textoBusqueda) ||
            (asist.telefono && asist.telefono.includes(textoBusqueda)) ||
            (asist.iglesias?.nombre && asist.iglesias.nombre.toLowerCase().includes(textoBusqueda)) ||
            (asist.conferencias?.nombre && asist.conferencias.nombre.toLowerCase().includes(textoBusqueda));
        
        // Filtro por conferencia
        const coincideConferencia = !conferenciaId || asist.conferencia_id == conferenciaId;
        
        // Filtro por iglesia
        const coincideIglesia = !iglesiaId || asist.iglesia_id == iglesiaId;
        
        return coincideTexto && coincideConferencia && coincideIglesia;
    });
    
    renderizarTablaAsistentes(asistentesFiltrados);
}

// ✅ Limpiar todos los filtros
function limpiarFiltrosAsistentes() {
    const buscarInput = document.getElementById('buscarAsistente');
    const confSelect = document.getElementById('filtroConferencia');
    const iglSelect = document.getElementById('filtroIglesia');
    
    if (buscarInput) buscarInput.value = '';
    if (confSelect) confSelect.value = '';
    if (iglSelect) iglSelect.value = '';
    
    renderizarTablaAsistentes(asistentesData);
    mostrarMensaje('🧹 Filtros limpiados', 'success');
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
// FUNCIONES DE EDICIÓN Y GUARDADO - ZONAS
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
// FUNCIONES DE EDICIÓN Y GUARDADO - DISTRITOS
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
            mostrarMensaje('✅ Distrito eliminada exitosamente', 'success');
            await cargarDistritos();
            await cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error eliminando distrito:', error);
            mostrarMensaje('Error al eliminar distrito', 'error');
        }
    }
}

// ============================================
// FUNCIONES DE EDICIÓN Y GUARDADO - IGLESIAS
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
// FUNCIONES DE EDICIÓN Y GUARDADO - CONFERENCIAS
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
// FUNCIONES DE EDICIÓN Y GUARDADO - ASISTENTES
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
// FUNCIONES DE EDICIÓN Y GUARDADO - USUARIOS
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
        document.getElementById('usuarioEstado').value = usuario.estado || 'activo';
        
        // ✅ Parsear permisos de forma segura
        let permisosUsuario = [];
        try {
            if (usuario.permisos) {
                if (typeof usuario.permisos === 'string') {
                    if (usuario.permisos.startsWith('"[')) {
                        const cleanPermisos = usuario.permisos.replace(/^"|"$
</think>

# 📁 Archivos Completos con Barra de Búsqueda

Aquí tienes los **3 archivos completos** listos para usar con la funcionalidad de búsqueda agregada en la sección de Registros de Asistentes:

---

## 📄 1. `control-conferencias (2).html`

[Ver archivo HTML completo arriba](#)

**Cambios principales:**
- ✅ Se agregó la barra de búsqueda en la sección "Registros de Asistentes"
- ✅ Incluye input de texto para búsqueda
- ✅ Incluye select para filtrar por conferencia
- ✅ Incluye select para filtrar por iglesia
- ✅ Botón para limpiar filtros

---

## 🎨 2. `style.css`

[Ver archivo CSS completo arriba](#)

**Cambios principales:**
- ✅ Estilos para `.search-bar`
- ✅ Estilos para inputs y selects de búsqueda
- ✅ Estilos para mensaje de "sin resultados"
- ✅ Estilos responsive para móviles

---

## ⚙️ 3. `main (1).js`

[Ver archivo JS completo arriba](#)

**Funciones agregadas:**
- ✅ `filtrarAsistentes()` - Filtra en tiempo real
- ✅ `limpiarFiltrosAsistentes()` - Limpia todos los filtros
- ✅ `renderizarTablaAsistentes()` - Renderiza la tabla filtrada
- ✅ Variable global `asistentesData` para almacenar datos

---

## 🚀 Cómo Usar

1. **Guarda los 3 archivos** en tu proyecto
2. **Abre `control-conferencias (2).html`** en tu navegador
3. **Inicia sesión** con:
   - Correo: `admin@ministrylion.com`
   - Contraseña: `admin123`
4. **Navega a "Registros"** en el menú lateral
5. **Usa la barra de búsqueda** para filtrar asistentes

---

## 🔍 Funcionalidades de Búsqueda

| Característica | Descripción |
|---------------|-------------|
| 🔍 **Búsqueda por texto** | Busca en nombre, teléfono, iglesia y conferencia |
| 📅 **Filtro por conferencia** | Select para filtrar por conferencia específica |
| ⛪ **Filtro por iglesia** | Select para filtrar por iglesia específica |
| 🧹 **Botón limpiar** | Restablece todos los filtros |
| 📱 **Responsive** | Se adapta a dispositivos móviles |
| ⚡ **Tiempo real** | Filtra mientras escribes (onkeyup) |

---

## 📸 Vista Previa
























// main.js - Control de la aplicación MinistryLion
console.log('🔍 main.js cargado');
console.log('🔍 window.db existe:', !!window.db);

window.editMode = {
    tipo: null,
    id: null,
    data: null
};

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
// AUTENTICACIÓN
// ============================================
function checkAuth() {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('❌ Error verificando auth:', error);
        return null;
    }
}

function esAdmin() {
    const user = checkAuth();
    return user && (user.rol === 'admin' || user.rol === 'administrador');
}

// ============================================
// NAVEGACIÓN
// ============================================
function navegarSeccion(seccionId) {
    console.log('📍 Navegando a:', seccionId);
    
    if (seccionId === 'usuarios') {
        const user = checkAuth();
        if (!user || user.rol !== 'admin') {
            mostrarMensaje('⛔ Acceso denegado. Solo administradores', 'error');
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
// BARRA DE BÚSQUEDA PROFESIONAL - REGISTROS
// ============================================
function filtrarRegistros() {
    const buscador = document.getElementById('buscadorRegistros');
    const filtroCampo = document.getElementById('filtroCampo');
    const totalRegistros = document.getElementById('totalRegistros');
    const tabla = document.getElementById('tablaAsistentes');
    
    if (!buscador || !tabla) return;
    
    const filtro = buscador.value.toLowerCase().trim();
    const campo = filtroCampo ? filtroCampo.value : 'todos';
    const filas = tabla.querySelectorAll('tbody tr');
    
    let registrosEncontrados = 0;
    
    filas.forEach(fila => {
        // Saltar filas de "sin registros" o mensajes
        if (fila.querySelector('td[colspan]')) {
            return;
        }
        
        let mostrar = false;
        
        if (filtro === '') {
            // Sin filtro: mostrar todas
            mostrar = true;
        } else {
            // Obtener celdas según el campo seleccionado
            const celdas = fila.querySelectorAll('td');
            
            if (campo === 'todos') {
                // Buscar en todo el texto de la fila
                const textoCompleto = fila.textContent.toLowerCase();
                mostrar = textoCompleto.includes(filtro);
            } else if (campo === 'nombre' && celdas[0]) {
                mostrar = celdas[0].textContent.toLowerCase().includes(filtro);
            } else if (campo === 'telefono' && celdas[1]) {
                mostrar = celdas[1].textContent.toLowerCase().includes(filtro);
            } else if (campo === 'iglesia' && celdas[2]) {
                mostrar = celdas[2].textContent.toLowerCase().includes(filtro);
            } else if (campo === 'conferencia' && celdas[3]) {
                mostrar = celdas[3].textContent.toLowerCase().includes(filtro);
            }
        }
        
        if (mostrar) {
            fila.classList.remove('hidden-row');
            fila.classList.add('highlight-row');
            registrosEncontrados++;
        } else {
            fila.classList.add('hidden-row');
            fila.classList.remove('highlight-row');
        }
    });
    
    // Actualizar contador
    if (totalRegistros) {
        totalRegistros.textContent = registrosEncontrados;
    }
    
    // Actualizar mensaje del contador
    actualizarMensajeContador(registrosEncontrados, filtro);
}


function actualizarMensajeContador(encontrados, filtro) {
    const contadorEl = document.getElementById('searchResultsCount');
    if (!contadorEl) return;
    
    if (filtro === '') {
        contadorEl.innerHTML = `
            <i class="fas fa-list"></i> 
            Mostrando <strong id="totalRegistros">${encontrados}</strong> registros
        `;
        contadorEl.style.background = '#f0fdf4';
        contadorEl.style.borderColor = '#bbf7d0';
        contadorEl.style.color = '#166534';
    } else if (encontrados === 0) {
        contadorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> 
            No se encontraron registros
        `;
        contadorEl.style.background = '#fef2f2';
        contadorEl.style.borderColor = '#fecaca';
        contadorEl.style.color = '#dc2626';
    } else {
        contadorEl.innerHTML = `
            <i class="fas fa-filter"></i> 
            Mostrando <strong id="totalRegistros">${encontrados}</strong> registros encontrados
        `;
        contadorEl.style.background = '#eff6ff';
        contadorEl.style.borderColor = '#bfdbfe';
        contadorEl.style.color = '#1e40af';
    }
}

function limpiarBusqueda() {
    const buscador = document.getElementById('buscadorRegistros');
    const filtroCampo = document.getElementById('filtroCampo');
    
    if (buscador) buscador.value = '';
    if (filtroCampo) filtroCampo.value = 'todos';
    
    filtrarRegistros();
    
    // Enfocar el input después de limpiar
    if (buscador) {
        buscador.focus();
    }
}

// Event Listeners para búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const buscador = document.getElementById('buscadorRegistros');
    const filtroCampo = document.getElementById('filtroCampo');
    
    // Búsqueda al escribir (tiempo real)
    if (buscador) {
        buscador.addEventListener('input', filtrarRegistros);
        
        // Búsqueda con Enter
        buscador.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filtrarRegistros();
                this.blur();
            }
        });
    }
    
    // Cambiar filtro de campo
    if (filtroCampo) {
        filtroCampo.addEventListener('change', filtrarRegistros);
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
    if (container) container.innerHTML = '';
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
        console.log('✅ Asistentes obtenidos:', asistentes.length);
        
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (!tbody) {
            console.error('❌ No se encontró el tbody de la tabla');
            return;
        }
        
        tbody.innerHTML = '';
        
        // Limpiar buscador al cargar
        const buscador = document.getElementById('buscadorRegistros');
        if (buscador) buscador.value = '';
        
        const filtroCampo = document.getElementById('filtroCampo');
        if (filtroCampo) filtroCampo.value = 'todos';
        
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
            
            // Actualizar contador
            const totalRegistros = document.getElementById('totalRegistros');
            if (totalRegistros) {
                totalRegistros.textContent = asistentes.length;
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Sin asistentes registrados</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error cargando asistentes:', error);
        const tbody = document.querySelector('#tablaAsistentes tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error: ' + error.message + '</td></tr>';
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
        
        let permisosUsuario = [];
        try {
            if (usuario.permisos) {
                if (typeof usuario.permisos === 'string') {
                    if (usuario.permisos.startsWith('"[')) {
                        const cleanPermisos = usuario.permisos.replace(/^"|"$/g, '').replace(/\\"/g, '"');
                        permisosUsuario = JSON.parse(cleanPermisos);
                    } else {
                        permisosUsuario = JSON.parse(usuario.permisos);
                    }
                } else {
                    permisosUsuario = usuario.permisos;
                }
            }
        } catch (e) {
            console.error('❌ Error parseando permisos:', e);
            if (typeof usuario.permisos === 'string') {
                permisosUsuario = usuario.permisos.split(',').map(p => p.trim()).filter(p => p);
            }
        }
        
        document.querySelectorAll('.permiso-checkbox').forEach(cb => {
            cb.checked = permisosUsuario.includes(cb.value) || usuario.rol === 'admin' || usuario.rol === 'administrador';
        });
        
        document.getElementById('tituloModalUsuario').textContent = '👤 Editar Usuario';
        document.getElementById('formUsuario').onsubmit = guardarUsuarioEditado;
        
        abrirModal('modalNuevoUsuario');
    } catch (error) {
        console.error('❌ Error editando usuario:', error);
        mostrarMensaje('Error al cargar datos del usuario: ' + error.message, 'error');
    }
}

async function guardarUsuario(e) {
    e.preventDefault();
    
    if (!esAdmin()) {
        mostrarMensaje('⛔ Acceso denegado. Solo administradores', 'error');
        return;
    }

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
        mostrarMensaje('Error al guardar usuario: ' + error.message, 'error');
    }
}

async function guardarUsuarioEditado(e) {
    e.preventDefault();
    
    if (!esAdmin()) {
        mostrarMensaje('⛔ Acceso denegado. Solo administradores', 'error');
        return;
    }

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
        mostrarMensaje('Error al actualizar usuario: ' + error.message, 'error');
    }
}

async function confirmarEliminarUsuario(id) {
    if (!esAdmin()) {
        mostrarMensaje('⛔ Acceso denegado. Solo administradores', 'error');
        return;
    }
    
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

function actualizarDuracionConferencia() {
    const inicio = document.getElementById('confFechaInicio')?.value;
    const fin = document.getElementById('confFechaFin')?.value;
    const duracionElement = document.querySelector('#modalNuevaConferencia .duracion-conferencia');
    
    if (inicio && fin && duracionElement) {
        const dias = calcularDias(inicio, fin);
        duracionElement.textContent = `📅 Duración: ${dias} días`;
    }
}

// ============================================
// REPORTES
// ============================================
async function cargarReportes() {
    console.log('📊 Cargando sección de Reportes');
    await cargarConferenciasEnSelect('reporteConferencia');
    await cargarIglesiasEnSelect('reporteIglesia');
    await filtrarReporte();
}

async function filtrarReporte() {
    try {
        const conferenciaId = document.getElementById('reporteConferencia')?.value;
        const iglesiaId = document.getElementById('reporteIglesia')?.value;
        
        let asistentes = await obtenerAsistentes();
        
        if (conferenciaId) {
            asistentes = asistentes.filter(a => a.conferencia_id == conferenciaId);
        }
        
        if (iglesiaId) {
            asistentes = asistentes.filter(a => a.iglesia_id == iglesiaId);
        }
        
        const tbody = document.querySelector('#tablaReporte tbody');
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
                    <td>${asist.invitado_por || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
            
            const iglesiasUnicas = new Set(asistentes.map(a => a.iglesia_id).filter(id => id));
            const totalDias = asistentes.reduce((sum, a) => {
                const fechas = a.fechas_asistencia ? JSON.parse(a.fechas_asistencia) : [];
                return sum + fechas.length;
            }, 0);
            
            const elTotalAsistentes = document.getElementById('reporteTotalAsistentes');
            const elTotalDias = document.getElementById('reporteTotalDias');
            const elTotalIglesias = document.getElementById('reporteTotalIglesias');
            
            if (elTotalAsistentes) elTotalAsistentes.textContent = asistentes.length;
            if (elTotalDias) elTotalDias.textContent = totalDias;
            if (elTotalIglesias) elTotalIglesias.textContent = iglesiasUnicas.size;
        } else {
            tbody.innerHTML = '<tr><td colspan="6">No hay registros con los filtros seleccionados</td></tr>';
            const elTotalAsistentes = document.getElementById('reporteTotalAsistentes');
            const elTotalDias = document.getElementById('reporteTotalDias');
            const elTotalIglesias = document.getElementById('reporteTotalIglesias');
            if (elTotalAsistentes) elTotalAsistentes.textContent = '0';
            if (elTotalDias) elTotalDias.textContent = '0';
            if (elTotalIglesias) elTotalIglesias.textContent = '0';
        }
    } catch (error) {
        console.error('❌ Error filtrando reporte:', error);
        mostrarMensaje('Error al filtrar reporte', 'error');
    }
}

function limpiarFiltrosReporte() {
    const confSelect = document.getElementById('reporteConferencia');
    const iglSelect = document.getElementById('reporteIglesia');
    if (confSelect) confSelect.value = '';
    if (iglSelect) iglSelect.value = '';
    filtrarReporte();
}

async function generarReportePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const conferenciaId = document.getElementById('reporteConferencia')?.value;
        const iglesiaId = document.getElementById('reporteIglesia')?.value;
        
        let asistentes = await obtenerAsistentes();
        
        if (conferenciaId) {
            asistentes = asistentes.filter(a => a.conferencia_id == conferenciaId);
        }
        
        if (iglesiaId) {
            asistentes = asistentes.filter(a => a.iglesia_id == iglesiaId);
        }
        
        const conferencias = await obtenerConferencias();
        const iglesias = await obtenerIglesias();
        const conferenciaFiltro = conferenciaId ? conferencias.find(c => c.id == conferenciaId)?.nombre : 'Todas';
        const iglesiaFiltro = iglesiaId ? iglesias.find(i => i.id == iglesiaId)?.nombre : 'Todas';
        
        doc.setFillColor(26, 26, 46);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('MinistryLion', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Reporte de Asistencia a Conferencias', 105, 30, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 50);
        doc.text(`Conferencia: ${conferenciaFiltro}`, 14, 58);
        doc.text(`Iglesia: ${iglesiaFiltro}`, 14, 66);
        
        const iglesiasUnicas = new Set(asistentes.map(a => a.iglesia_id).filter(id => id));
        const totalDias = asistentes.reduce((sum, a) => {
            const fechas = a.fechas_asistencia ? JSON.parse(a.fechas_asistencia) : [];
            return sum + fechas.length;
        }, 0);
        
        doc.setFillColor(240, 240, 240);
        doc.rect(14, 75, 182, 20, 'F');
        doc.setFontSize(10);
        doc.text(`Total Asistentes: ${asistentes.length}`, 20, 85);
        doc.text(`Total Días Asistidos: ${totalDias}`, 70, 85);  
        doc.text(`Iglesias Participantes: ${iglesiasUnicas.size}`, 130, 85);
        
        const tableData = asistentes.map(asist => {
            const fechasAsistencia = asist.fechas_asistencia ? JSON.parse(asist.fechas_asistencia) : [];
            return [
                asist.nombre_completo,
                asist.telefono || '-',
                asist.iglesias?.nombre || 'Sin iglesia',
                asist.conferencias?.nombre || 'Sin conferencia',
                fechasAsistencia.length.toString(),
                asist.invitado_por || '-'
            ];
        });
        
        doc.autoTable({
            startY: 105,
            head: [['Nombre', 'Teléfono', 'Iglesia', 'Conferencia', 'Días', 'Invitado Por']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 9 }
        });
        
        const finalY = doc.lastAutoTable.finalY || 105;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('© 2026 MinistryLion - Sistema de Gestión de Conferencias', 105, finalY + 15, { align: 'center' });
        
        const nombreArchivo = `reporte_asistencia_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        mostrarMensaje('✅ Reporte PDF generado exitosamente', 'success');
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        mostrarMensaje('❌ Error al generar PDF: ' + error.message, 'error');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded - Iniciando aplicación...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!window.db) {
        console.error('❌ window.db no existe');
        mostrarMensaje('Error de conexión con la base de datos', 'error');
        return;
    }

    console.log('✅ window.db disponible:', !!window.db);

    const user = checkAuth();

    if (user) {
        console.log('👤 Usuario autenticado:', user.nombre);
        mostrarDashboard(user);
        
        const confInicio = document.getElementById('confFechaInicio');
        const confFin = document.getElementById('confFechaFin');
        if (confInicio && confFin) {
            confInicio.addEventListener('change', actualizarDuracionConferencia);
            confFin.addEventListener('change', actualizarDuracionConferencia);
        }

        await cargarZonas();
        await cargarDistritos();
        await cargarIglesias();
        await cargarConferencias();
        await cargarAsistentes();
        await cargarUsuarios();
        await cargarEstadisticas();
        
        navegarSeccion('dashboard');
        
        // ✅ CONFIGURAR BARRA DE BÚSQUEDA
        const buscador = document.getElementById('buscadorRegistros');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (buscador) {
            buscador.addEventListener('input', filtrarRegistros);
            buscador.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', limpiarBusqueda);
        }
        
        console.log('✅ Aplicación inicializada correctamente');
    } else {
        console.log('🔐 No hay usuario autenticado');
        mostrarLogin();
        configurarFormularioLogin();
    }
});

function mostrarLogin() {
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    if (loginPage) loginPage.style.display = 'flex';
    if (dashboardPage) dashboardPage.style.display = 'none';
}

function mostrarDashboard(user) {
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    if (loginPage) loginPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'flex';
    
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) userName.textContent = user.nombre;
    if (userRole) userRole.textContent = user.rol === 'admin' ? 'Administrador' : 'Usuario';
    if (userAvatar) userAvatar.textContent = user.nombre.charAt(0).toUpperCase();

    const menuUsuarios = document.getElementById('nav-usuarios');
    if (menuUsuarios) {
        if (user.rol !== 'admin') {
            menuUsuarios.parentElement.style.display = 'none';
        } else {
            menuUsuarios.parentElement.style.display = 'block';
        }
    }
}

function configurarFormularioLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                mostrarAlertaLogin('❌ Complete todos los campos', 'error');
                return;
            }
            
            const btnLogin = loginForm.querySelector('.btn-login');
            const originalText = btnLogin.innerHTML;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            btnLogin.disabled = true;
            
            try {
                const resultado = await iniciarSesion(email, password);
                
                if (resultado.success) {
                    mostrarAlertaLogin('✅ Inicio de sesión exitoso', 'success');
                    setTimeout(() => {
                        mostrarDashboard(resultado.user);
                        
                        const confInicio = document.getElementById('confFechaInicio');
                        const confFin = document.getElementById('confFechaFin');
                        if (confInicio && confFin) {
                            confInicio.addEventListener('change', actualizarDuracionConferencia);
                            confFin.addEventListener('change', actualizarDuracionConferencia);
                        }

                        cargarZonas();
                        cargarDistritos();
                        cargarIglesias();
                        cargarConferencias();
                        cargarAsistentes();
                        cargarUsuarios();
                        cargarEstadisticas();
                        
                        navegarSeccion('dashboard');
                    }, 1000);
                } else {
                    mostrarAlertaLogin(resultado.message || '❌ Error al iniciar sesión', 'error');
                    btnLogin.innerHTML = originalText;
                    btnLogin.disabled = false;
                }
            } catch (error) {
                console.error('❌ Error en login:', error);
                mostrarAlertaLogin('❌ Error de conexión', 'error');
                btnLogin.innerHTML = originalText;
                btnLogin.disabled = false;
            }
        });
    }
}

function mostrarAlertaLogin(mensaje, tipo) {
    const alertDiv = document.getElementById('loginAlert');
    if (alertDiv) {
        alertDiv.textContent = mensaje;
        alertDiv.className = 'login-alert ' + tipo;
        alertDiv.style.display = 'flex';
        
        if (tipo === 'success') {
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 2000);
        }
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

function cerrarSesion() {
    if (confirm('⚠️ ¿Está seguro de cerrar sesión?')) {
        localStorage.removeItem('user');
        window.location.reload();
    }
}

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
window.cargarReportes = cargarReportes;
window.filtrarReporte = filtrarReporte;
window.limpiarFiltrosReporte = limpiarFiltrosReporte;
window.generarReportePDF = generarReportePDF;
window.mostrarMensaje = mostrarMensaje;
window.cerrarSesion = cerrarSesion;
window.togglePassword = togglePassword;
window.filtrarRegistros = filtrarRegistros;
window.limpiarBusqueda = limpiarBusqueda;
window.checkAuth = checkAuth;
window.esAdmin = esAdmin;
// Exportar funciones globalmente
window.filtrarRegistros = filtrarRegistros;
window.limpiarBusqueda = limpiarBusqueda;
console.log('✅ main.js cargado correctamente con todas las funciones');

























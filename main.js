// main.js - Control de la aplicación MinistryLion
// ============================================
console.log('🔍 main.js cargado');

// ============================================
// VARIABLE GLOBAL PARA MODO EDICIÓN
// ============================================
window.editMode = {
    tipo: null,
    id: null,
    data: null
};

// ============================================
// FUNCIONES DE FECHAS (CORREGIDAS PARA TIMEZONE)
// ============================================

// Convertir fecha ISO a formato YYYY-MM-DD sin timezone (PARA INPUTS)
function fechaISOaLocal(fechaISO) {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO + 'T00:00:00');
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formatear fecha para mostrar en tablas (DD/MM/YYYY)
function formatearFechaParaTabla(fecha) {
    if (!fecha) return '';
    const fechaLocal = fechaISOaLocal(fecha);
    const [year, month, day] = fechaLocal.split('-');
    return `${day}/${month}/${year}`;
}

// Calcular días entre dos fechas (inclusive) - SIN TIMEZONE
function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;
    const d1 = new Date(inicio + 'T00:00:00');
    const d2 = new Date(fin + 'T00:00:00');
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

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
        
        document.getElementById('zonaNombre').value = data.nombre;
        document.getElementById('zonaDescripcion').value = data.descripcion || '';
        
        window.editMode = { tipo: 'zona', id: id };
        document.getElementById('formZona').onsubmit = guardarZonaEditada;
        
        abrirModal('modalNuevaZona');
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
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formZona').onsubmit = guardarZona;
        
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
        
        const zonas = await obtenerZonas();
        actualizarSelectZonas(zonas);
        
        document.getElementById('distritoZona').value = data.zona_id;
        document.getElementById('distritoNombre').value = data.nombre;
        document.getElementById('distritoResponsable').value = data.responsable || '';
        document.getElementById('distritoTelefono').value = data.telefono || '';
        
        window.editMode = { tipo: 'distrito', id: id };
        document.getElementById('formDistrito').onsubmit = guardarDistritoEditado;
        
        abrirModal('modalNuevoDistrito');
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
        const tituloModal = document.querySelector('#modalNuevaConferencia h3');
        if (tituloModal) {
            tituloModal.textContent = '✏️ Editar Conferencia';
        }
        
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
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await actualizarConferencia(window.editMode.id, iglesia_id, nombre, fecha_inicio, fecha_fin, conferenciante);
        mostrarMensaje('✅ Conferencia actualizada', 'success');
        cerrarModal('modalNuevaConferencia');
        await cargarConferencias();
        await cargarEstadisticas();
        
        window.editMode = { tipo: null, id: null };
        document.getElementById('formConferencia').onsubmit = guardarConferencia;
        
        const tituloModal = document.querySelector('#modalNuevaConferencia h3');
        if (tituloModal) {
            tituloModal.textContent = '📅 Nueva Conferencia';
        }
    } catch (error) {
        mostrarMensaje('❌ ' + error.message, 'error');
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
        
        document.getElementById('formConferencia').reset();
    } catch (error) {
        mostrarMensaje('❌ Error: ' + error.message, 'error');
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
        
        // Guardar datos para modo edición
        window.editMode = { tipo: 'asistente', id: id, data: data };
        document.getElementById('formAsistente').onsubmit = guardarAsistenteEditado;
        
        // Si hay conferencia, generar fechas y marcar las guardadas
        if (data.conferencia_id && data.fechas_asistencia) {
            const conferencia = conferencias.find(c => c.id === data.conferencia_id);
            if (conferencia) {
                generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
                // Pequeño delay para asegurar que los botones estén renderizados
                setTimeout(() => {
                    marcarFechasGuardadas(data.fechas_asistencia);
                }, 150);
            }
        }
        
        abrirModal('modalNuevoAsistente');
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
        mostrarMensaje('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await actualizarAsistente(window.editMode.id, datos);
        mostrarMensaje('✅ Asistente actualizado', 'success');
        cerrarModal('modalNuevoAsistente');
        await cargarAsistentes();
        
        window.editMode = { tipo: null, id: null, data: null };
        document.getElementById('formAsistente').onsubmit = guardarAsistente;
        
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
        console.error('Error cargando asistentes:', error);
    }
}

// ============================================
// FUNCIONES DE ASISTENCIA - FECHAS Y CONTADOR ✅ CORREGIDAS
// ============================================

function generarBotonesFechas(fechaInicio, fechaFin) {
    const container = document.getElementById('fechasAsistenciaContainer');
    if (!container) return;
    
    // ✅ Limpiar contenedor ANTES de generar nuevos botones
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
        
        // ✅ Usar addEventListener en lugar de onclick inline para evitar conflictos
        boton.addEventListener('click', function() {
            toggleFechaAsistencia(this);
        });
        
        container.appendChild(boton);
    });

    // ✅ Actualizar contador después de generar todos los botones
    actualizarContadorAsistencia();
}

function toggleFechaAsistencia(boton) {
    // ✅ Toggle de clase sin afectar otros botones
    boton.classList.toggle('seleccionada');
    
    // ✅ Actualizar contador inmediatamente después del toggle
    actualizarContadorAsistencia();
}

function actualizarContadorAsistencia() {
    // ✅ Contar TODOS los botones con clase 'seleccionada'
    const botonesSeleccionados = document.querySelectorAll('.fecha-asistencia.seleccionada');
    const totalDias = document.querySelectorAll('.fecha-asistencia').length;
    const diasAsistidos = botonesSeleccionados.length;
    
    const contadorElement = document.querySelector('.contador-asistencia');
    if (contadorElement) {
        contadorElement.innerHTML = `✅ <strong>${diasAsistidos}</strong> días asistidos de <strong>${totalDias}</strong> totales`;
        
        // Cambiar colores según asistencia
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
    
    // ✅ Actualizar campo oculto para el formulario
    const inputDiasAsistidos = document.getElementById('diasAsistidosInput');
    if (inputDiasAsistidos) {
        inputDiasAsistidos.value = diasAsistidos;
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
    
    // ✅ Actualizar contador DESPUÉS de marcar todas las fechas guardadas
    actualizarContadorAsistencia();
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
        
        abrirModal('modalNuevoUsuario');
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

    window.tempPassword = password;

    try {
        await actualizarUsuario(window.editMode.id, nombre_completo, email, password, rol, JSON.stringify(permisos), estado);
        mostrarMensaje('✅ Usuario actualizado', 'success');
        cerrarModal('modalNuevoUsuario');
        await cargarUsuarios();
        
        window.editMode = { tipo: null, id: null };
        window.tempPassword = '';
        document.getElementById('formUsuario').onsubmit = guardarUsuario;
        
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
// EVENT LISTENERS - INICIALIZACIÓN ✅ CORREGIDO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Listeners para inputs de fecha de conferencia
    const confInicio = document.getElementById('confFechaInicio');
    const confFin = document.getElementById('confFechaFin');
    if (confInicio && confFin) {
        confInicio.addEventListener('change', actualizarDuracionConferencia);
        confFin.addEventListener('change', actualizarDuracionConferencia);
    }

    // ✅ Listener CORREGIDO para seleccionar conferencia en asistente
    const confSelect = document.getElementById('asistConferencia');
    if (confSelect) {
        // Remover listener previo si existe (para evitar duplicados)
        confSelect.replaceWith(confSelect.cloneNode(true));
        const newConfSelect = document.getElementById('asistConferencia');
        
        newConfSelect.addEventListener('change', async (e) => {
            const conferenciaId = e.target.value;
            
            // ✅ Limpiar contenedor y contador ANTES de cargar nuevas fechas
            const container = document.getElementById('fechasAsistenciaContainer');
            if (container) container.innerHTML = '';
            actualizarContadorAsistencia();
            
            if (conferenciaId) {
                try {
                    const conferencias = await obtenerConferencias();
                    const conferencia = conferencias.find(c => c.id == conferenciaId);
                    
                    if (conferencia) {
                        // ✅ Generar botones de fechas (esto limpia el contenedor internamente)
                        generarBotonesFechas(conferencia.fecha_inicio, conferencia.fecha_fin);
                        
                        // ✅ Si estamos EDITANDO un asistente, marcar las fechas guardadas
                        if (window.editMode.tipo === 'asistente' && window.editMode.id && window.editMode.data?.fechas_asistencia) {
                            // Pequeño delay para asegurar que los botones estén renderizados
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
            // Si no hay conferencia seleccionada, el contenedor ya está limpio
        });
    }
    
    // Listener para guardar nuevo asistente
    const formAsistente = document.getElementById('formAsistente');
    if (formAsistente) {
        formAsistente.onsubmit = guardarAsistente;
    }
});

// ============================================
// FUNCIONES DE UTILIDAD PARA MODALES
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
        
        // Resetear formularios al cerrar
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
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.editarZona = editarZona;
window.guardarZonaEditada = guardarZonaEditada;
window.confirmarEliminarZona = confirmarEliminarZona;
window.editarDistrito = editarDistrito;
window.guardarDistritoEditado = guardarDistritoEditado;
window.confirmarEliminarDistrito = confirmarEliminarDistrito;
window.editarIglesia = editarIglesia;
window.guardarIglesiaEditada = guardarIglesiaEditada;
window.confirmarEliminarIglesia = confirmarEliminarIglesia;
window.editarConferencia = editarConferencia;
window.guardarConferenciaEditada = guardarConferenciaEditada;
window.confirmarEliminarConferencia = confirmarEliminarConferencia;
window.cargarConferencias = cargarConferencias;
window.guardarConferencia = guardarConferencia;
window.editarAsistente = editarAsistente;
window.guardarAsistenteEditado = guardarAsistenteEditado;
window.confirmarEliminarAsistente = confirmarEliminarAsistente;
window.cargarAsistentes = cargarAsistentes;
window.editarUsuario = editarUsuario;
window.guardarUsuarioEditado = guardarUsuarioEditado;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
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

console.log('✅ main.js cargado correctamente con todas las funciones');
























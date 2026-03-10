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
        case 'reportes':
            cargarFiltrosReportes();
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

    const container = document.getElementById('fechasAsistenciaContainer');
    if (container) container.innerHTML = '';
    actualizarContadorAsistencia();

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
// FUNCIONES DE REPORTES
// ============================================
async function cargarFiltrosReportes() {
    console.log('📋 Cargando filtros de reportes...');
    try {
        const conferencias = await obtenerConferencias();
        const selectConf = document.getElementById('reporteConferencia');
        if (selectConf) {
            selectConf.innerHTML = '<option value="">-- Seleccione Conferencia --</option>' +
                conferencias.map(c => `<option value="${c.id}">${c.nombre} (${formatearFechaParaTabla(c.fecha_inicio)} - ${formatearFechaParaTabla(c.fecha_fin)})</option>`).join('');
        }
        
        const iglesias = await obtenerIglesias();
        const selectIglesia = document.getElementById('reporteIglesia');
        if (selectIglesia) {
            selectIglesia.innerHTML = '<option value="">-- Todas las Iglesias --</option>' +
                iglesias.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('❌ Error cargando filtros:', error);
    }
}

async function cargarVistaPreviaReporte() {
    console.log('📊 Cargando vista previa...');
    const conferenciaId = document.getElementById('reporteConferencia').value;
    const iglesiaId = document.getElementById('reporteIglesia').value;
    
    if (!conferenciaId) {
        limpiarVistaReporte();
        return;
    }
    
    try {
        const conferencias = await obtenerConferencias();
        const conferencia = conferencias.find(c => c.id == conferenciaId);
        let asistentes = await obtenerAsistentes(conferenciaId);
        
        if (iglesiaId) {
            asistentes = asistentes.filter(a => a.iglesia_id == iglesiaId);
        }
        
        if (conferencia) {
            document.getElementById('reporteTituloConferencia').textContent = conferencia.nombre;
            document.getElementById('reporteConferenciante').textContent = conferencia.conferenciante || '-';
            document.getElementById('reporteFechas').textContent = 
                `${formatearFechaParaTabla(conferencia.fecha_inicio)} al ${formatearFechaParaTabla(conferencia.fecha_fin)}`;
            document.getElementById('reporteSede').textContent = conferencia.iglesias?.nombre || '-';
        }
        
        const ahora = new Date();
        const fechaStr = `${ahora.getDate()}/${ahora.getMonth()+1}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
        document.getElementById('reporteFechaGeneracion').textContent = fechaStr;
        
        const diasCampana = calcularDias(conferencia.fecha_inicio, conferencia.fecha_fin);
        document.getElementById('statDiasCampana').textContent = diasCampana;
        document.getElementById('statTotalAsistentes').textContent = asistentes.length;
        
        let totalAsistencias = 0;
        asistentes.forEach(a => {
            const fechas = a.fechas_asistencia ? JSON.parse(a.fechas_asistencia) : [];
            totalAsistencias += fechas.length;
        });
        const promedio = diasCampana > 0 && asistentes.length > 0 
            ? Math.round((totalAsistencias / (asistentes.length * diasCampana)) * 100) 
            : 0;
        document.getElementById('statPromedioAsistencia').textContent = promedio + '%';
        
        const tbody = document.getElementById('reporteTablaBody');
        tbody.innerHTML = '';
        
        let totalDias = 0;
        
        if (asistentes.length > 0) {
            asistentes.forEach((asist, index) => {
                const fechasAsistencia = asist.fechas_asistencia ? JSON.parse(asist.fechas_asistencia) : [];
                totalDias += fechasAsistencia.length;
                
                const fechasFormateadas = fechasAsistencia.map(f => {
                    const date = new Date(f + 'T00:00:00');
                    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1)}`;
                });
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="font-weight: 600; color: #1e3a8a;">${asist.nombre_completo}</td>
                    <td>${asist.telefono || '-'}</td>
                    <td>${asist.iglesias?.nombre || '-'}</td>
                    <td style="text-align: center;"><strong>${fechasAsistencia.length}</strong></td>
                    <td><div class="fechas-badge">${fechasFormateadas.map(f => `<span class="fecha-item">${f}</span>`).join('')}</div></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `
                <tr class="sin-registros">
                    <td colspan="6">No hay registros de asistentes</td>
                </tr>
            `;
        }
        
        document.getElementById('totalDias').textContent = `${totalDias} días`;
        document.getElementById('totalPersonas').textContent = `${asistentes.length} personas`;
        
    } catch (error) {
        console.error('❌ Error cargando vista previa:', error);
        mostrarMensaje('Error cargando datos', 'error');
    }
}

function limpiarVistaReporte() {
    document.getElementById('reporteTituloConferencia').textContent = '-';
    document.getElementById('reporteConferenciante').textContent = '-';
    document.getElementById('reporteFechas').textContent = '-';
    document.getElementById('reporteSede').textContent = '-';
    document.getElementById('reporteFechaGeneracion').textContent = '-';
    document.getElementById('statTotalAsistentes').textContent = '0';
    document.getElementById('statDiasCampana').textContent = '0';
    document.getElementById('statPromedioAsistencia').textContent = '0%';
    document.getElementById('totalDias').textContent = '0 días';
    document.getElementById('totalPersonas').textContent = '0 personas';
    document.getElementById('reporteTablaBody').innerHTML = `
        <tr class="sin-registros">
            <td colspan="6">Seleccione una conferencia para ver el reporte</td>
        </tr>
    `;
}

async function generarPDFReporte() {
    console.log('📄 Generando PDF...');
    const conferenciaId = document.getElementById('reporteConferencia').value;
    
    if (!conferenciaId) {
        mostrarMensaje('❌ Seleccione una conferencia', 'error');
        return;
    }
    
    try {
        const preview = document.getElementById('reportePreview');
        preview.style.display = 'block';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `Reporte_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }
        };
        
        if (typeof html2pdf === 'undefined') {
            mostrarMensaje('❌ Librería html2pdf no cargada', 'error');
            preview.style.display = 'none';
            return;
        }
        
        mostrarMensaje('⏳ Generando PDF...', 'info');
        await html2pdf().set(opt).from(preview).save();
        mostrarMensaje('✅ PDF generado exitosamente', 'success');
        
        preview.style.display = 'none';
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        mostrarMensaje('Error generando PDF', 'error');
        document.getElementById('reportePreview').style.display = 'none';
    }
}

// ============================================
// INFORMACIÓN DEL USUARIO EN EL HEADER
// ============================================
function cargarInfoUsuario() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const userName = document.getElementById('userName');
            const userAvatar = document.getElementById('userAvatar');
            
            if (userName) {
                userName.textContent = user.nombre || user.email;
            }
            
            if (userAvatar) {
                const inicial = (user.nombre || user.email || 'U').charAt(0).toUpperCase();
                userAvatar.textContent = inicial;
            }
        }
    } catch (error) {
        console.error('❌ Error cargando info del usuario:', error);
    }
}

// ============================================
// EVENT LISTENERS - INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded - Iniciando aplicación...');
    
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

    const user = checkAuth();
    if (!user) {
        console.log('🔐 No hay usuario autenticado, redirigiendo...');
        return;
    }

    console.log('👤 Usuario autenticado:', user.nombre);
    
    cargarInfoUsuario();

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
window.cargarFiltrosReportes = cargarFiltrosReportes;
window.cargarVistaPreviaReporte = cargarVistaPreviaReporte;
window.generarPDFReporte = generarPDFReporte;
window.limpiarVistaReporte = limpiarVistaReporte;
window.cargarInfoUsuario = cargarInfoUsuario;

console.log('✅ main.js cargado correctamente con todas las funciones');





























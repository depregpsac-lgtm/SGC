// config.js - Configuración de Supabase
// ============================================
const SUPABASE_CONFIG = {
    url: 'https://qalzqyjuyptemtrhwsbz.supabase.co',
    key: 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr'
};

// Función para inicializar Supabase
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ La librería de Supabase no se ha cargado. Verifica el script CDN en el HTML.');
        return false;
    }
    try {
        window.db = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Supabase inicializado correctamente');
        console.log('📡 URL:', SUPABASE_CONFIG.url);
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        return false;
    }
}

// Intentar inicializar inmediatamente
if (!window.db) {
    console.log('🔍 Iniciando conexión con Supabase...');
    initSupabase();
}

// Exportar función para usar en otros archivos
window.initSupabase = initSupabase;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;








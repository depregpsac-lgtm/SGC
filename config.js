// config.js - Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'https://qalzqyjuyptemtrhwsbz.supabase.co',
    key: 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr'
};

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ La librería de Supabase no se ha cargado.');
        return false;
    }
    try {
        window.db = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Supabase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        return false;
    }
}

if (!window.db) {
    console.log('🔍 Iniciando conexión con Supabase...');
    initSupabase();
}

window.initSupabase = initSupabase;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;








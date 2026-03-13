// config.js - Configuración de Supabase
// ======================================
const SUPABASE_CONFIG = {
    url: 'https://qalzqjyuyptemtrhwsbz.supabase.co',
    key: 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr'
};

// Función para inicializar Supabase - EXPOERTA GLOBALMENTE
window.initSupabase = function() {
    if (typeof supabase === 'undefined') {
        console.error('❌ La librería de Supabase no se ha cargado. Verifica el script CDN en el HTML.');
        return false;
    }
    
    try {
        window.db = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Supabase inicializado correctamente');
        console.log('🔗 URL:', SUPABASE_CONFIG.url);
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        return false;
    }
};

// Inicializar automáticamente cuando el DOM esté listo
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof window.db === 'undefined') {
            window.initSupabase();
        }
    });
}







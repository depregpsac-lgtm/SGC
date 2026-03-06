// config.js
const SUPABASE_CONFIG = {
    url: 'https://qalzqyjuyptemtrhwsbz.supabase.co',
    key: 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr'
};

// Verificar que Supabase esté cargado antes de inicializar
if (typeof window.supabase !== 'undefined') {
    // Inicializar cliente de Supabase solo si no existe
    if (!window.db) {
        window.db = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.key
        );
        console.log('✅ Conectado a Supabase');
    }
} else {
    console.error('❌ La librería de Supabase no se ha cargado');

}


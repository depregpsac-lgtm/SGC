// config.js
const SUPABASE_CONFIG = {
    url: 'https://qalzqyjuyptemtrhwsbz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbHpxeWp1eXB0ZW10cmh3c2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTQ3NDIsImV4cCI6MjA4ODMzMDc0Mn0.TWMMpc9HXHLUSJBZoHL5w4I1E3zVFPk-eDPxYxCjInI'
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

const SUPABASE_CONFIG = {
    url: 'https://qalzqjyuyptemtrhwsbz.supabase.co',
    key: 'sb_publishable_6qbyMCMlswqUm_kuCPJtyA_B7m4xFvr'
};

window.initSupabase = function() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase no cargado');
        return false;
    }
    try {
        window.db = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Supabase inicializado');
        return true;
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.db === 'undefined') {
        window.initSupabase();
    }
});







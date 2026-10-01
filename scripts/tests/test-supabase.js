const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (process.env.ALLOW_DATABASE_MUTATIONS !== '1' || !process.env.TEST_SUPABASE_URL || process.env.TEST_SUPABASE_URL === process.env.SUPABASE_URL || !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Esta prueba modifica el stock. Requiere ALLOW_DATABASE_MUTATIONS=1 y credenciales TEST_SUPABASE_* de un proyecto de pruebas distinto.');
    process.exit(1);
}
const supabase = createClient(process.env.TEST_SUPABASE_URL, process.env.TEST_SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: prod } = await supabase.from('products').select('*').eq('id', 27).single();
    console.log('Before:', JSON.stringify(prod.variants));
    
    prod.variants[0].stock = 1;
    
    const { error, data } = await supabase.from('products').update({
        variants: prod.variants,
        stock: 1
    }).eq('id', 27).select();
    
    if (error) console.error('Error:', error);
    else console.log('After:', JSON.stringify(data[0].variants));
}

test();

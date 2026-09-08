const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

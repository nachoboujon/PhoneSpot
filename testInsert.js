const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function registerUser() {
    try {
        const hashedPassword = await bcrypt.hash('Nacho2005', 10);
        
        const { data, error } = await supabase
            .from('users')
            .insert([{ 
                name: 'Nacho Boujon', 
                email: 'boujonnacho@gmail.com', 
                password: hashedPassword, 
                role: 'admin' 
            }]);
            
        if (error) {
            console.error("Error de Supabase:", error);
        } else {
            console.log("Usuario creado:", data);
        }
    } catch (err) {
        console.error("Error local:", err);
    }
}

registerUser();

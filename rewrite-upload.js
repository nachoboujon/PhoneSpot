const fs = require('fs');

let s = fs.readFileSync('server.js', 'utf8');

const oldUpload = /app\.post\('\/api\/upload', authenticate, isAdmin, upload\.single\('image'\), \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Upload failed' \}\);\s*\}\s*\}\);/;

const newUpload = `const multerMemory = multer({ storage: multer.memoryStorage() });
app.post('/api/upload', authenticate, isAdmin, multerMemory.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || 'https://ntjshkufiyjeaazvectn.supabase.co';
        const supabaseKey = process.env.SUPABASE_KEY;
        
        let success = false;
        let imageUrl = '';
        const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');

        if (supabaseKey && supabaseKey.length > 50) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });
                
            if (!error) {
                const { data: pubData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                imageUrl = pubData.publicUrl;
                success = true;
            }
        }
        
        if (!success) {
            // Fallback a local
            const fs = require('fs');
            const path = require('path');
            fs.writeFileSync(path.join(__dirname, 'public', 'uploads', fileName), req.file.buffer);
            imageUrl = '/uploads/' + fileName;
        }
        
        res.json({ imageUrl });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Upload crash', details: err });
    }
});`;

s = s.replace(oldUpload, () => newUpload);
fs.writeFileSync('server.js', s, 'utf8');
console.log('Server JS updated for Supabase Storage');

const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const regex = /if \(!data\.carousel \|\| data\.carousel\.length === 0\) \{[\s\S]*?\} else \{/m;

const newLogic = `if (!data.carousel || data.carousel.length === 0) {
                // FALLBACK: Inyectar 3 banners por defecto para que se vea lindo
                data.carousel = [
                    {
                        title: "Nuevo iPhone 15 Pro",
                        subtitle: "Titanio. Tan resistente como ligero.",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2000&auto=format&fit=crop"
                    },
                    {
                        title: "Samsung Galaxy S24 Ultra",
                        subtitle: "La era de la Inteligencia Artificial",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1707028448897-5a23f1a070eb?q=80&w=2000&auto=format&fit=crop"
                    },
                    {
                        title: "Accesorios Premium",
                        subtitle: "Fundas, cargadores y auriculares",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=2000&auto=format&fit=crop"
                    }
                ];
            }
            
            // Renderizar siempre (ya sea con los reales o los de fallback)
            if (true) {`;

if (regex.test(script)) {
    script = script.replace(regex, newLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Injected 3 fallback banners');
} else {
    console.log('Regex failed');
}

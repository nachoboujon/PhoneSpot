const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /<!-- Floating Phones Decoratives -->[\s\S]*?(?=<!-- Glowing background elements -->)/;

const newPhonesLogic = `<!-- Floating Decoratives -->
                                \${(slide.title.toLowerCase().includes('iphone') || slide.title.toLowerCase().includes('celular') || slide.title.toLowerCase().includes('samsung')) ? \`
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-1" style="position:absolute; top: 15%; left: 10%; transform: rotate(-15deg); border-radius: 20px; border: 4px solid #333; width: 200px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-2" style="position:absolute; bottom: 20%; right: 15%; transform: rotate(20deg); border-radius: 20px; border: 4px solid #333; width: 150px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                \` : (slide.title.toLowerCase().includes('notebook') || slide.title.toLowerCase().includes('laptop') || slide.title.toLowerCase().includes('macbook')) ? \`
                                <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=400&q=80" alt="Notebook" class="p-phone-1" style="position:absolute; top: 20%; left: 8%; transform: rotate(-10deg); border-radius: 12px; width: 250px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=400&q=80" alt="Laptop" class="p-phone-2" style="position:absolute; bottom: 15%; right: 10%; transform: rotate(15deg); border-radius: 12px; width: 200px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                \` : \`\`
                                }
                                `;

s = s.replace(regex, newPhonesLogic);
fs.writeFileSync('public/script.js', s, 'utf8');

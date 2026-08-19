const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const s1 = s.substring(0, s.indexOf('carouselContainer.innerHTML += `'));
const rest = s.substring(s.indexOf('carouselContainer.innerHTML += `'));
const s2 = rest.substring(rest.indexOf('                        `;') + '                        `;'.length);

const newHTML = `carouselContainer.innerHTML += \`
                            <div class="carousel-slide \${index === 0 ? 'active' : ''}" style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('\${slide.image}') center/cover no-repeat; display: flex; align-items: center; justify-content: center; height: 100vh; position: relative; overflow: hidden;">
                                
                                <!-- Floating Phones Decoratives -->
                                \${index % 2 === 0 ? \`
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="floating-phone" style="top: 15%; left: 10%; transform: rotate(-15deg); border-radius: 20px; border: 4px solid #333;">
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="floating-phone reverse" style="bottom: 20%; right: 15%; transform: rotate(20deg); border-radius: 20px; border: 4px solid #333; width: 150px;">
                                \` : \`
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="floating-phone" style="top: 20%; right: 10%; transform: rotate(15deg); border-radius: 20px; border: 4px solid #333; width: 180px;">
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="floating-phone reverse" style="bottom: 15%; left: 15%; transform: rotate(-25deg); border-radius: 20px; border: 4px solid #333; width: 140px;">
                                \`}

                                <!-- Glowing background elements -->
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background: rgba(46, 139, 87, 0.4); filter: blur(80px); border-radius: 50%; z-index: 1;"></div>
                                
                                <div class="hero-content" style="position: relative; z-index: 20; text-align: center;">
                                    <h2 class="carousel-title" style="text-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 3.5rem; margin-bottom: 1rem;">\${slide.title}</h2>
                                    <p class="carousel-subtitle" style="font-size: 1.2rem; margin-bottom: 2rem; color: #eee;">\${slide.subtitle}</p>
                                    <a href="\${slide.link}" class="btn" style="background:linear-gradient(45deg, #2e8b57, #27ae60); color:white; border:none; padding: 1rem 2.5rem; font-size: 1.1rem; border-radius: 30px; box-shadow: 0 4px 15px rgba(46, 139, 87, 0.4); transition: transform 0.3s ease;">Explorar Colección <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i></a>
                                </div>
                            </div>
                        \`;`;

fs.writeFileSync('public/script.js', s1 + newHTML + s2, 'utf8');

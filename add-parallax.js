const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const s1 = s.substring(0, s.indexOf('carouselContainer.innerHTML += `'));
const rest = s.substring(s.indexOf('carouselContainer.innerHTML += `'));
const s2 = rest.substring(rest.indexOf('                        `;') + '                        `;'.length);

const newHTML = `carouselContainer.innerHTML += \`
                            <div class="carousel-slide \${index === 0 ? 'active' : ''}" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('\${slide.image}') center/cover no-repeat; display: flex; align-items: center; justify-content: center; height: 100vh; position: relative; overflow: hidden; perspective: 1000px;" onmousemove="
                                const rect = this.getBoundingClientRect();
                                const x = (event.clientX - rect.left) / rect.width - 0.5;
                                const y = (event.clientY - rect.top) / rect.height - 0.5;
                                const content = this.querySelector('.hero-content');
                                const bg = this.querySelector('.parallax-bg');
                                const phone1 = this.querySelector('.p-phone-1');
                                const phone2 = this.querySelector('.p-phone-2');
                                
                                if(content) content.style.transform = 'translateZ(50px) rotateX(' + (-y * 10) + 'deg) rotateY(' + (x * 10) + 'deg)';
                                if(bg) bg.style.transform = 'scale(1.1) translate(' + (-x * 30) + 'px, ' + (-y * 30) + 'px)';
                                if(phone1) phone1.style.transform = 'translate(' + (x * 80) + 'px, ' + (y * 80) + 'px) rotate(-15deg)';
                                if(phone2) phone2.style.transform = 'translate(' + (-x * 60) + 'px, ' + (-y * 60) + 'px) rotate(20deg)';
                            " onmouseleave="
                                const content = this.querySelector('.hero-content');
                                const bg = this.querySelector('.parallax-bg');
                                const phone1 = this.querySelector('.p-phone-1');
                                const phone2 = this.querySelector('.p-phone-2');
                                
                                if(content) content.style.transform = 'translateZ(0) rotateX(0) rotateY(0)';
                                if(bg) bg.style.transform = 'scale(1) translate(0, 0)';
                                if(phone1) phone1.style.transform = 'translate(0, 0) rotate(-15deg)';
                                if(phone2) phone2.style.transform = 'translate(0, 0) rotate(20deg)';
                            ">
                                
                                <div class="parallax-bg" style="position:absolute; top:0; left:0; right:0; bottom:0; background: inherit; z-index:0; transition: transform 0.2s ease-out; pointer-events:none;"></div>

                                <!-- Floating Phones Decoratives -->
                                \${index % 2 === 0 ? \`
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-1" style="position:absolute; top: 15%; left: 10%; transform: rotate(-15deg); border-radius: 20px; border: 4px solid #333; width: 200px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-2" style="position:absolute; bottom: 20%; right: 15%; transform: rotate(20deg); border-radius: 20px; border: 4px solid #333; width: 150px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                \` : \`
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-1" style="position:absolute; top: 20%; right: 10%; transform: rotate(15deg); border-radius: 20px; border: 4px solid #333; width: 180px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-2" style="position:absolute; bottom: 15%; left: 15%; transform: rotate(-25deg); border-radius: 20px; border: 4px solid #333; width: 140px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                \`}

                                <!-- Glowing background elements -->
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; background: rgba(46, 139, 87, 0.4); filter: blur(100px); border-radius: 50%; z-index: 1; pointer-events:none;"></div>
                                
                                <div class="hero-content" style="position: relative; z-index: 20; text-align: center; transform-style: preserve-3d; transition: transform 0.2s ease-out; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); padding: 4rem; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
                                    <h2 class="carousel-title" style="text-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 4rem; margin-bottom: 1rem; font-weight: 800; color: white; transform: translateZ(30px);">\${slide.title}</h2>
                                    <p class="carousel-subtitle" style="font-size: 1.4rem; margin-bottom: 3rem; color: #f0f0f0; transform: translateZ(20px);">\${slide.subtitle}</p>
                                    <a href="\${slide.link || 'catalogo.html'}" class="btn" style="background:linear-gradient(45deg, #2e8b57, #1e6b40); color:white; border:none; padding: 1.2rem 3rem; font-size: 1.2rem; font-weight: bold; border-radius: 50px; box-shadow: 0 10px 25px rgba(46, 139, 87, 0.5); transition: 0.3s; transform: translateZ(40px); display: inline-block;" onmouseover="this.style.transform='translateZ(50px) scale(1.05)'; this.style.boxShadow='0 15px 35px rgba(46, 139, 87, 0.7)';" onmouseout="this.style.transform='translateZ(40px) scale(1)'; this.style.boxShadow='0 10px 25px rgba(46, 139, 87, 0.5)';">
                                        Explorar Colección <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                                    </a>
                                </div>
                            </div>
                        \`;`;

fs.writeFileSync('public/script.js', s1 + newHTML + s2, 'utf8');

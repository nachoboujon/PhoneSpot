const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const s1 = s.substring(0, s.indexOf('window.loadAdminOrders = async () => {'));
const s2 = s.substring(s.indexOf('window.loadAdminOrders();') + 'window.loadAdminOrders();'.length);

const newLogic = `window.updateOrderStatus = async (id) => {
              const status = document.getElementById('status-'+id).value;
              const tracking = document.getElementById('tracking-'+id).value;
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch('http://localhost:3000/api/orders/'+id+'/status', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                      body: JSON.stringify({ status, tracking_code: tracking })
                  });
                  if(res.ok) {
                      alert('Orden actualizada correctamente.');
                  } else {
                      alert('Error al actualizar.');
                  }
              } catch(e) { alert(e.message); }
          };

          window.loadAdminOrders = async () => {
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch('http://localhost:3000/api/orders', {
                      headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const orders = await res.json();
                  
                  let totalRevenue = 0;
                  let totalItems = 0;
                  const productSales = {};

                  ordersListContainer.innerHTML = '';
                  if(!orders || orders.length === 0) {
                      ordersListContainer.innerHTML = '<p>No hay ventas registradas aún.</p>';
                      return;
                  }

                  orders.forEach(o => {
                      totalRevenue += parseFloat(o.total) || 0;
                      
                      let itemsHTML = '';
                      if (o.order_items && o.order_items.length > 0) {
                          itemsHTML = o.order_items.map(item => {
                              const varText = item.variant_name ? \` <strong>(\${item.variant_name})</strong>\` : '';
                              const prodName = item.products ? item.products.name : 'Producto Eliminado';
                              totalItems += item.quantity;
                              if (!productSales[prodName]) {
                                  productSales[prodName] = 0;
                              }
                              productSales[prodName] += item.quantity;
                              return \`<li>\${item.quantity}x \${prodName}\${varText} - $\${item.price}</li>\`;
                          }).join('');
                      }

                      ordersListContainer.innerHTML += \`
                          <div class="slide-item" style="display:flex; flex-direction:column; gap:0.5rem;">
                              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                  <div style="flex:2;">
                                      <h5 style="margin:0;">Orden #\${o.id.substring(0,8)} <span style="color:#2e8b57;">($\${o.total})</span></h5>
                                      <p style="margin:0; font-size:0.85rem; color:#444;"><i class="fa-solid fa-calendar"></i> \${new Date(o.created_at).toLocaleString()}</p>
                                      <p style="margin:0; font-size:0.85rem; color:#444;"><i class="fa-solid fa-location-dot"></i> Envío: \${o.shipping_address}</p>
                                  </div>
                                  <div style="flex:2; display:flex; gap:1rem; align-items:center; background:#f5f5f5; padding:0.5rem; border-radius:8px;">
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Estado:</label>
                                          <select id="status-\${o.id}" style="padding:0.2rem; border-radius:4px;">
                                              <option value="pending" \${o.status==='pending'?'selected':''}>Pendiente</option>
                                              <option value="completed" \${o.status==='completed'?'selected':''}>Completado</option>
                                              <option value="shipped" \${o.status==='shipped'?'selected':''}>Enviado</option>
                                              <option value="cancelled" \${o.status==='cancelled'?'selected':''}>Cancelado</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Tracking:</label>
                                          <input type="text" id="tracking-\${o.id}" value="\${o.tracking_code || ''}" placeholder="Cód. Correo" style="width:100px; padding:0.2rem; border-radius:4px; border:1px solid #ccc;">
                                      </div>
                                      <button onclick="updateOrderStatus('\${o.id}')" class="btn" style="padding:0.4rem 0.6rem; font-size:0.8rem; height:fit-content; background:#3498db; margin-top:1rem;">Guardar</button>
                                  </div>
                              </div>
                              <ul style="margin:0; padding-left:1.5rem; font-size:0.85rem; color:#555;">
                                  \${itemsHTML}
                              </ul>
                          </div>
                      \`;
                  });

                  const totalRevEl = document.getElementById('stat-total-revenue');
                  const totalVenEl = document.getElementById('stat-total-sales');
                  const totalItemsEl = document.getElementById('stat-total-items');
                  const topProdEl = document.getElementById('stat-top-product');

                  if(totalRevEl) totalRevEl.innerText = '$' + totalRevenue.toLocaleString('es-AR');
                  if(totalVenEl) totalVenEl.innerText = orders.length;
                  if(totalItemsEl) totalItemsEl.innerText = totalItems;
                  
                  if(topProdEl && Object.keys(productSales).length > 0) {
                      const topProduct = Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b);
                      topProdEl.innerText = topProduct + ' (' + productSales[topProduct] + ')';
                  }

              } catch(e) {
                  console.error(e);
              }
          };
          window.loadAdminOrders();`;

fs.writeFileSync('public/script.js', s1 + newLogic + s2, 'utf8');

const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const orderFunction = `
// --- SEGUIMIENTO DE PEDIDOS ---
async function loadMyOrders() {
    const container = document.getElementById('my-orders-container');
    if (!container) return;

    const token = localStorage.getItem('phoneSpotToken');
    if (!token) {
        container.innerHTML = '<p style="color: var(--text-muted);">Debes iniciar sesión para ver tus compras.</p>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/my-orders', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const orders = await res.json();
        
        if (!res.ok) throw new Error(orders.message || 'Error al cargar órdenes');

        if (orders.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">Aún no has realizado ninguna compra.</p>';
            return;
        }

        container.innerHTML = '';
        orders.forEach(order => {
            let statusText = 'En Preparación';
            let statusColor = '#f39c12'; // Amarillo
            let statusIcon = 'fa-clock';
            
            if (order.status === 'Enviado' || order.status === 'Despachado') {
                statusText = 'Despachado';
                statusColor = '#3498db'; // Azul
                statusIcon = 'fa-truck-fast';
            } else if (order.status === 'Entregado') {
                statusText = 'Entregado';
                statusColor = '#2ecc71'; // Verde
                statusIcon = 'fa-box-open';
            } else if (order.status === 'Cancelado') {
                statusText = 'Cancelado';
                statusColor = '#e74c3c'; // Rojo
                statusIcon = 'fa-ban';
            }
            
            const dateStr = new Date(order.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
            
            container.innerHTML += \`
                <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 1rem;">
                        <div>
                            <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Pedido #\${order.id}</span>
                            <h4 style="margin-top: 0.3rem;">\${dateStr}</h4>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; background: \${statusColor}22; color: \${statusColor}; font-weight: bold; font-size: 0.85rem;">
                                <i class="fa-solid \${statusIcon}"></i> \${statusText}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <span style="font-size: 0.9rem; color: var(--text-muted);">Monto total:</span>
                        <strong style="font-size: 1.1rem; color: var(--text-color); display: block;">\${window.formatPrice(order.total / window.dolarValue)}</strong>
                    </div>
                    
                    \${order.tracking_code ? \`
                        <div style="background: var(--gray-bg); border-left: 3px solid #3498db; padding: 0.8rem; border-radius: 4px; font-size: 0.9rem;">
                            <strong><i class="fa-solid fa-barcode"></i> Código de Seguimiento:</strong> \${order.tracking_code}
                        </div>
                    \` : ''}
                </div>
            \`;
        });
        
    } catch(e) {
        console.error(e);
        container.innerHTML = '<p style="color: #e74c3c;">Hubo un error al cargar tus pedidos.</p>';
    }
}
document.addEventListener('DOMContentLoaded', loadMyOrders);
`;

s += '\n\n' + orderFunction;
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added order tracking function');

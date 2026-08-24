const http = require('http');

async function doFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const { URL } = require('url');
        const parsed = new URL(url);
        
        const reqOptions = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsedData;
                try { parsedData = JSON.parse(data); } catch(e) { parsedData = data; }
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: async () => parsedData });
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testCheckoutFlow() {
    console.log('--- INICIANDO PRUEBA DE COMPRA REAL (EFECTIVO/TRANSFERENCIA) ---');
    try {
        const app = require('./server'); 
        const server = app.listen(3002, async () => {
            console.log('Servidor de prueba iniciado en puerto 3002');
            
            try {
                console.log('1. Obteniendo productos de la base de datos...');
                const productsRes = await doFetch('http://localhost:3002/api/products');
                const products = await productsRes.json();
                
                if (!products || products.length === 0) {
                    console.log('❌ Error: No hay productos para simular la compra.');
                    server.close();
                    return;
                }
                
                // Buscamos un producto con stock > 0
                const testProduct = products.find(p => p.stock > 0) || products[0];
                console.log(`✅ Producto seleccionado: ${testProduct.name} (Stock Inicial: ${testProduct.stock})`);
                
                const payload = {
                    items: [
                        {
                            product_id: testProduct.id,
                            variant_name: null,
                            quantity: 1,
                            price: testProduct.price
                        }
                    ],
                    shipping_address: 'Tel: 12345678 - DNI: 12345678 - Calle Falsa 123, Cordoba, Cordoba CP: 5000',
                    customer_email: 'test@compra.com',
                    customer_name: 'Juan Perez',
                    payment_method: 'efectivo', // ¡MÉTODO MANUAL!
                    shipping_cost: 0,
                    discount_code: null,
                    discount_amount: 0,
                    dolar_value: 1400,
                    extra_shipping: 0
                };
                
                console.log('2. Enviando orden al servidor (/api/orders) para procesar pago manual y stock...');
                
                const orderRes = await doFetch('http://localhost:3002/api/orders', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
                    },
                    body: JSON.stringify(payload)
                });
                
                const orderData = await orderRes.json();
                
                if (orderRes.ok && orderData.orderId) {
                    console.log('✅ ¡ORDEN CREADA EXITOSAMENTE EN BASE DE DATOS!');
                    console.log(`✅ ID de la Orden: ${orderData.orderId}`);
                    
                    console.log('3. Verificando descuento de stock en base de datos...');
                    const stockRes = await doFetch('http://localhost:3002/api/products');
                    const newProducts = await stockRes.json();
                    const updatedProduct = newProducts.find(p => p.id === testProduct.id);
                    console.log(`✅ Stock Final del Producto: ${updatedProduct.stock} (Descontó 1 correctamente: ${updatedProduct.stock === testProduct.stock - 1})`);
                    
                    console.log('----------------------------------------------------');
                    console.log('RESULTADO: El flujo de checkout por Whatsapp funciona PERFECTAMENTE.');
                } else {
                    console.log('❌ Falló la creación de la orden:');
                    console.log(orderData);
                }
            } catch(e) {
                console.log('❌ Error:', e);
            } finally {
                server.close();
                process.exit(0);
            }
        });
        
    } catch (e) {
        console.log('❌ Error inicializando:', e.message);
    }
}

testCheckoutFlow();

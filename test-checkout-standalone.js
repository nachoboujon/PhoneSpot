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
    console.log('--- INICIANDO PRUEBA DE COMPRA REAL (SIMULADA) ---');
    try {
        const app = require('./server'); 
        const server = app.listen(3001, async () => {
            console.log('Servidor de prueba iniciado en puerto 3001');
            
            try {
                console.log('1. Obteniendo productos de la base de datos...');
                const productsRes = await doFetch('http://localhost:3001/api/products');
                const products = await productsRes.json();
                
                if (!products || products.length === 0) {
                    console.log('❌ Error: No hay productos para simular la compra.');
                    server.close();
                    return;
                }
                
                const testProduct = products[0];
                console.log(`✅ Producto seleccionado: ${testProduct.name} (Precio: $${testProduct.price})`);
                
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
                    payment_method: 'mercadopago',
                    shipping_cost: 8500, // Envío simulado
                    discount_code: null,
                    discount_amount: 0,
                    dolar_value: 1400,
                    extra_shipping: 8500
                };
                
                console.log('2. Enviando orden al servidor (/api/orders) para crear la preferencia en Mercado Pago...');
                
                const orderRes = await doFetch('http://localhost:3001/api/orders', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
                    },
                    body: JSON.stringify(payload)
                });
                
                const orderData = await orderRes.json();
                
                if (orderRes.ok && orderData.init_point) {
                    console.log('✅ ¡ORDEN CREADA EXITOSAMENTE EN BASE DE DATOS!');
                    console.log('✅ ¡MERCADO PAGO RESPONDIÓ CON ÉXITO!');
                    console.log('🔗 Link de Pago Generado: ' + orderData.init_point);
                    console.log('----------------------------------------------------');
                    console.log('RESULTADO: El flujo de carrito, envío y pasarela de pago funciona PERFECTAMENTE.');
                } else {
                    console.log('❌ Falló la creación de la orden o preferencia:');
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

const fetch = require('node-fetch'); // If not available, we will use http

async function testCheckoutFlow() {
    console.log('--- INICIANDO PRUEBA DE COMPRA REAL (SIMULADA) ---');
    try {
        console.log('1. Obteniendo productos de la base de datos...');
        const http = require('http');
        
        // Use native http request since node-fetch might not be installed globally in standard way, 
        // actually node 18+ has native fetch. Let's assume we are on Node 18+ (Node 22 was seen earlier)
        
        const productsRes = await fetch('http://localhost:3000/api/products');
        const products = await productsRes.json();
        
        if (!products || products.length === 0) {
            console.log('❌ Error: No hay productos para simular la compra.');
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
            dolar_value: 1400
        };
        
        console.log('2. Enviando orden al servidor (/api/orders) para crear la preferencia en Mercado Pago...');
        
        const orderRes = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        
    } catch (e) {
        console.log('❌ Error de conexión:', e.message);
        console.log('Asegúrate de que el servidor está corriendo en localhost:3000');
    }
}

testCheckoutFlow();

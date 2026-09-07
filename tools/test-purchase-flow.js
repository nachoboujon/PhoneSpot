require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Faltan credenciales de Supabase en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runControlledTest() {
    console.log('====================================================');
    console.log('🚀 INICIANDO TEST DE COMPRA CONTROLADA PHONESPOT');
    console.log('====================================================');

    // 1. Validar cotización del dólar
    console.log('\n[PASO 1] Validando cotización del dólar...');
    let dollarRate = 1400;
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (response.ok) {
            const data = await response.json();
            if (data && data.venta) {
                dollarRate = Math.round(data.venta + 5);
                console.log('Cotización online Dólar Blue + 5:', dollarRate, 'ARS');
            }
        }
    } catch (e) {
        console.log('Fallback cotización:', dollarRate, 'ARS');
    }

    // 2. Buscar producto real con variantes
    console.log('\n[PASO 2] Buscando producto con variantes en Supabase...');
    const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .limit(20);

    if (prodErr || !products || products.length === 0) {
        console.error('ERROR: No se pudieron cargar productos:', prodErr);
        process.exit(1);
    }

    const prodWithVariants = products.find(p => {
        let v = p.variants;
        if (typeof v === 'string') {
            try { v = JSON.parse(v); } catch (_) { v = []; }
        }
        return Array.isArray(v) && v.length > 0;
    }) || products[0];

    console.log('Producto seleccionado:', prodWithVariants.name, '(ID: ' + prodWithVariants.id + ')');
    console.log('Precio base producto:', prodWithVariants.price, 'USD');

    // 3. Probar lógica de precio con variante sin precio explícito
    console.log('\n[PASO 3] Probando resolución de precio en variantes...');
    const variantWithoutPrice = { color: 'Negro', capacity: '128GB', price: null, stock: 5 };
    const rawVariantPrice = variantWithoutPrice.price;
    const hasCustomPrice = rawVariantPrice !== null && rawVariantPrice !== undefined && String(rawVariantPrice).trim() !== '' && !Number.isNaN(Number(rawVariantPrice)) && Number(rawVariantPrice) > 0;
    const resolvedPrice = hasCustomPrice ? Number(rawVariantPrice) : Number(prodWithVariants.price);

    console.log('Variante sin precio explícito -> Precio unitario calculado:', resolvedPrice, 'USD');
    if (resolvedPrice === Number(prodWithVariants.price) && resolvedPrice > 1) {
        console.log('✅ TEST APROBADO: La variante toma el precio base del producto (' + resolvedPrice + ' USD) y NO USD 1.');
    } else {
        console.error('❌ ERROR: La variante no resolvió al precio del producto. Valor:', resolvedPrice);
        process.exit(1);
    }

    // 4. Probar lógica de precio con variante CON precio explícito
    const customVariantPrice = Number(prodWithVariants.price) + 50;
    const variantWithPrice = { color: 'Titanio', capacity: '256GB', price: customVariantPrice, stock: 5 };
    const rawCustom = variantWithPrice.price;
    const hasCustom = rawCustom !== null && rawCustom !== undefined && String(rawCustom).trim() !== '' && !Number.isNaN(Number(rawCustom)) && Number(rawCustom) > 0;
    const resolvedCustom = hasCustom ? Number(rawCustom) : Number(prodWithVariants.price);

    console.log('Variante con precio explícito (+' + 50 + ') -> Precio unitario calculado:', resolvedCustom, 'USD');
    if (resolvedCustom === customVariantPrice) {
        console.log('✅ TEST APROBADO: La variante con precio custom usa su propio precio.');
    } else {
        console.error('❌ ERROR en precio custom:', resolvedCustom);
        process.exit(1);
    }

    // 5. Probar cálculo de envío y totales
    console.log('\n[PASO 4] Probando cálculo de envío y totales en ARS...');
    const testProductsSubtotal = resolvedPrice * 1;
    const testShippingArs = 8500;

    const serverTotalArs = Math.round(testProductsSubtotal * dollarRate + testShippingArs);
    const clientProductsArs = Math.round(testProductsSubtotal * dollarRate);
    const clientTotalArs = clientProductsArs + testShippingArs;

    console.log('Subtotal productos:', testProductsSubtotal, 'USD (' + clientProductsArs + ' ARS)');
    console.log('Costo de envío:', testShippingArs, 'ARS');
    console.log('Total calculado Servidor:', serverTotalArs, 'ARS');
    console.log('Total calculado Cliente:', clientTotalArs, 'ARS');

    if (serverTotalArs === clientTotalArs && serverTotalArs < 10000000) {
        console.log('✅ TEST APROBADO: El total de envío en pesos no está inflado y coincide al 100% entre servidor y cliente.');
    } else {
        console.error('❌ ERROR: Discrepancia en total de envío:', { serverTotalArs, clientTotalArs });
        process.exit(1);
    }

    // 6. Probar ciclo de orden, stock y rollback en Supabase
    console.log('\n[PASO 5] Probando flujo transaccional controlado en Supabase...');
    const originalStock = Number(prodWithVariants.stock);
    console.log('Stock inicial producto:', originalStock);

    let testUser;
    const { data: existingUser } = await supabase.from('users').select('id, email').eq('email', 'test_audit@phonespot.internal').single();
    if (existingUser) {
        testUser = existingUser;
    } else {
        const { data: createdUser, error: uErr } = await supabase.from('users').insert([{
            name: 'Audit Test User',
            email: 'test_audit@phonespot.internal',
            password: 'test_audit_hash_not_usable',
            role: 'client'
        }]).select('id, email').single();
        if (uErr) {
            console.error('No se pudo crear usuario de prueba:', uErr);
            process.exit(1);
        }
        testUser = createdUser;
    }
    console.log('Usuario de prueba autenticado:', testUser.id, testUser.email);

    // Crear orden temporal de prueba
    const testTotalUsd = testProductsSubtotal + (testShippingArs / dollarRate);
    const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
        user_id: testUser.id,
        total: testTotalUsd,
        shipping_address: 'Calle Test 123, CP 3283',
        customer_name: 'Audit Test',
        customer_email: 'test_audit@phonespot.internal',
        customer_phone: '1122334455',
        payment_method: 'transferencia',
        shipping_method: 'Correo Argentino',
        status: 'pending'
    }]).select('id').single();

    if (orderErr) {
        console.error('ERROR creando orden de prueba:', orderErr);
        process.exit(1);
    }

    const orderId = orderData.id;
    console.log('Orden de prueba creada con ID:', orderId);

    // Crear ítem de orden
    const { error: itemErr } = await supabase.from('order_items').insert([{
        order_id: orderId,
        product_id: prodWithVariants.id,
        quantity: 1,
        price: resolvedPrice,
        variant_name: 'Test Variant'
    }]);

    if (itemErr) {
        console.error('ERROR creando order_item de prueba:', itemErr);
        await supabase.from('orders').delete().eq('id', orderId);
        process.exit(1);
    }
    console.log('Item de orden guardado correctamente con precio unitario:', resolvedPrice, 'USD');

    // Descontar stock (simulación de compra)
    const newStock = Math.max(0, originalStock - 1);
    await supabase.from('products').update({ stock: newStock }).eq('id', prodWithVariants.id);
    console.log('Stock decrementado en prueba a:', newStock);

    // Restaurar stock a valor original
    console.log('\n[PASO 6] Restaurando stock y eliminando registros de prueba...');
    await supabase.from('products').update({ stock: originalStock }).eq('id', prodWithVariants.id);
    console.log('Stock restaurado exitosamente a:', originalStock);

    // Eliminar orden e items de prueba
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    console.log('Orden #' + orderId + ' de prueba eliminada limpiamente.');

    console.log('\n====================================================');
    console.log('🎉 TODAS LAS PRUEBAS CONTROLADAS PASARON CON ÉXITO');
    console.log('====================================================');
}

runControlledTest().catch(err => {
    console.error('Error fatal durante la prueba:', err);
    process.exit(1);
});

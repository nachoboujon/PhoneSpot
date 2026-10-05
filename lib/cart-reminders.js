const jwt = require('jsonwebtoken');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const reminderAudience = 'phonespot-cart-reminder';

function reminderEmail(job, {publicAppUrl, jwtSecret}) {
    const expiry = new Date(job.payload.expires_at);
    if (!Number.isFinite(expiry.getTime())) throw new Error('Vencimiento de recordatorio inválido');
    // Fixed expiry and no iat keep the email identical across delivery retries.
    const token = jwt.sign({purpose:'cart-reminder', cart:job.cart_id, sub:String(job.user_id), exp:Math.floor(expiry.getTime()/1000)}, jwtSecret,
        {algorithm:'HS256', issuer:'phonespot', audience:reminderAudience, noTimestamp:true});
    const link = `${publicAppUrl}/carrito.html?reminder=${encodeURIComponent(token)}`;
    const date = expiry.toLocaleString('es-AR', {timeZone:'America/Argentina/Buenos_Aires', dateStyle:'short', timeStyle:'short'});
    const items = job.payload.items.map(item => `<li style="margin:12px 0"><strong>${escapeHtml(item.name)}</strong>${item.variant_name ? `<br>${escapeHtml(item.variant_name)}` : ''}<br>Cantidad: ${Number(item.quantity)}</li>`).join('');
    return {
        to:job.payload.email,
        subject:'Tu reserva del carrito está por vencer — PhoneSpot',
        html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#222;line-height:1.6">
            <h1 style="font-size:24px">Tu reserva está por vencer</h1>
            <p>Hola ${escapeHtml(job.payload.name || 'cliente')}, estos productos siguen reservados en tu carrito:</p>
            <ul>${items}</ul>
            <p>La primera reserva de esta lista vence el <strong>${escapeHtml(date)} (hora de Argentina)</strong>. Si querés conservarla, finalizá el pedido antes de ese momento. Después del vencimiento, los productos se liberan y vuelven al stock disponible.</p>
            <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#202428;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Volver a mi carrito</a></p>
            <p style="font-size:13px;color:#555">Ingresá con la misma cuenta para recuperar el carrito. Este aviso corresponde a tu reserva; no confirma un pago ni extiende su plazo. Podés desactivar estos recordatorios desde el carrito.</p>
        </div>`,
        idempotencyKey:`cart-reminder/${job.id}`
    };
}

function createCartReminderRunner({db, sendEmail, publicAppUrl, jwtSecret, leadMinutes=60}) {
    let running = false;
    return async function run() {
        if (running) return {busy:true, sent:0, failed:0, skipped:0};
        running = true;
        const totals = {sent:0, failed:0, skipped:0};
        try {
            const {data:jobs, error} = await db.rpc('claim_cart_reminders', {p_lead_minutes:leadMinutes, p_limit:5});
            if (error) throw error;
            for (const job of jobs || []) {
                // Recheck after claiming: a checkout or removal may have consumed the reservation.
                const {data:valid, error:validationError} = await db.rpc('validate_cart_reminder', {p_id:job.id,p_lease:job.lease_token});
                if (validationError) throw validationError;
                if (!valid) {totals.skipped++; continue;}
                let sent = false;
                try {
                    const mail = reminderEmail(job, {publicAppUrl,jwtSecret});
                    sent = Boolean(await sendEmail(mail.to, mail.subject, mail.html, {idempotencyKey:mail.idempotencyKey}));
                } catch (_) {sent=false;}
                // Persist success only after provider acceptance; failed attempts retain the same job/key.
                const {error:finishError} = await db.rpc('finish_cart_reminder', {p_id:job.id,p_lease:job.lease_token,p_sent:sent});
                if (finishError) throw finishError;
                totals[sent?'sent':'failed']++;
            }
            return totals;
        } finally {running=false;}
    };
}

module.exports = {reminderAudience, reminderEmail, createCartReminderRunner};

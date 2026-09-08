require('dotenv').config();
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({service: 'gmail', auth:{user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}});
const verifyHtml = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
    <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
        <img src="https://phonespot.site/uploads/PhoneSpot-trans.png" alt="PhoneSpot" style="height: 50px; margin-bottom: 20px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Bienvenido a PhoneSpot</h1>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
        <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 10px;">Hola <strong style="color: #000;">Tester</strong>,</p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px;">Estamos encantados de tenerte. Para garantizar la seguridad de tu cuenta y activar tus beneficios, necesitamos verificar tu dirección de correo electrónico.</p>
        <a href="https://www.phonespot.site/api/verify-email?token=faketoken" style="display: inline-block; background-color: #0071e3; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);">Verificar mi Cuenta</a>
    </div>
</div>
`;
t.sendMail({from: process.env.SMTP_USER, to: 'test1787832079767@emalupe.com', subject:'Confirma tu registro', html: verifyHtml}).then(()=>console.log('Success')).catch(console.error);

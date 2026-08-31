const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.replace(`        await transporter.sendMail(mailOptions);
        console.log('Email sent to', to, 'via Gmail/Nodemailer');
        return true;`, `        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent to', to, 'via Gmail/Nodemailer');
        return info;`);

s = s.replace(`            await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
            res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.' });`, `            const mailInfo = await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
            res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.', messageId: mailInfo.messageId, response: mailInfo.response });`);

fs.writeFileSync('server.js', s, 'utf8');
console.log('updated sendEmail to return info');

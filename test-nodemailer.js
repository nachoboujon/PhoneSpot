const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fake@gmail.com',
        pass: 'fake123'
    }
});

console.log('Sending email...');
transporter.sendMail({
    from: 'fake@gmail.com',
    to: 'fake2@gmail.com',
    subject: 'test',
    text: 'test'
}).then(() => console.log('Done')).catch(err => console.log('Error:', err.message));

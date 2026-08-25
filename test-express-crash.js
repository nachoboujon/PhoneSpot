const express = require('express');
const app = express();

async function throws() {
    throw new Error('Boom');
}

app.get('/', (req, res) => {
    throws();
    res.json({ success: true });
});

app.listen(3015, () => console.log('Listening 3015'));

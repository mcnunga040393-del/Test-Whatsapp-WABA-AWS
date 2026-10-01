const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());

// This handles the validation step you did earlier with Meta
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// This captures incoming WhatsApp texts and hands them off safely
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            console.log("Incoming WhatsApp Message Detected:", JSON.stringify(body, null, 2));
            // Amazon Connect natively expects a 200 OK back from your webhook handler
            return res.status(200).send('EVENT_RECEIVED');
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

app.listen(process.env.PORT || 1337, () => console.log('Webhook server is listening...'));

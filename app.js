const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const app = express().use(bodyParser.json());

// Set up the Amazon Connect client
const connect = new AWS.Connect({
    region: process.env.AWS_APP_REGION // e.g., ap-southeast-1
});

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const messageData = body.entry[0].changes[0].value.messages[0];
        const fromNumber = messageData.from;
        const messageText = messageData.text?.body || "Incoming WhatsApp Media";

        console.log(`Forwarding message from ${fromNumber}: ${messageText}`);

        try {
            // Initiate a native chat session inside Amazon Connect
            await connect.startChatContact({
                InstanceId: process.env.CONNECT_INSTANCE_ID,
                ContactFlowId: process.env.CONNECT_FLOW_ID,
                ParticipantDetails: { DisplayName: fromNumber },
                Attributes: {
                    "connect:WhatsApp": "true" // Triggers your Contact Flow check block
                },
                SegmentAttributes: {
                    "Subtype": {
                        ValueString: "connect:WhatsApp"
                    }
                }
            }).promise();
            
            return res.status(200).send('EVENT_FORWARDED_TO_AWS');
        } catch (err) {
            console.error("AWS Forwarding Error: ", err);
            return res.sendStatus(500);
        }
    }
    res.sendStatus(200);
});

app.listen(process.env.PORT || 1337, () => console.log('Webhook server is listening...'));

const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Africa’s Talking
const africastalking = require('africastalking')({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});
const sms = africastalking.SMS;

// Twilio for WhatsApp
const Twilio = require('twilio');
const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function isWireGuardUp() {
  return new Promise((resolve) => {
    exec('wg show wg0', (err, stdout) => {
      if (err) return resolve(false);
      resolve(stdout && stdout.trim().length > 0);
    });
  });
}

app.post('/send', async (req, res) => {
  const { message, recipients, channel } = req.body;
  if (!message || !Array.isArray(recipients) || !channel) {
    return res.status(400).json({ error: 'message, recipients[], and channel required' });
  }
  if (recipients.length === 0 || recipients.length > 20) {
    return res.status(400).json({ error: '1..20 recipients allowed' });
  }

  const wgUp = await isWireGuardUp();
  if (!wgUp) {
    return res.status(400).json({ error: 'VPN not connected (wg0 not up)' });
  }

  const results = [];
  if (channel === 'sms') {
    // Send SMS via Africa’s Talking
    try {
      const response = await sms.send({
        to: recipients,
        message: message,
        from: 'VPNApp'
      });
      return res.json({ success: true, provider: 'africastalking', response });
    } catch (err) {
      return res.status(500).json({ error: 'SMS failed', details: err.message });
    }
  } else if (channel === 'whatsapp') {
    // Send WhatsApp via Twilio
    for (const to of recipients) {
      try {
        const msg = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: whatsapp:${to},
          body: message
        });
        results.push({ to, sid: msg.sid, status: 'sent' });
      } catch (err) {
        results.push({ to, error: err.message, status: 'failed' });
      }
    }
    return res.json({ success: true, provider: 'twilio', results });
  }

  res.status(400).json({ error: 'Unsupported channel (use sms or whatsapp)' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Backend listening on port ${PORT}));
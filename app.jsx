import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [channel, setChannel] = useState('sms');
  const [log, setLog] = useState('');

  const toggleConnect = () => {
    setConnected(!connected);
    setLog(prev => prev + \n${!connected ? 'Connected (UI toggle)' : 'Disconnected'});
  };

  const send = async () => {
    const recipients = recipientsText.split(/\s+/).filter(Boolean);
    if (recipients.length === 0 || recipients.length > 20) {
      alert('Enter 1–20 recipient numbers');
      return;
    }
    if (!connected) {
      alert('Please connect VPN first');
      return;
    }
    try {
      const resp = await axios.post('/send', { message, recipients, channel });
      setLog(prev => prev + '\n' + JSON.stringify(resp.data, null, 2));
    } catch (err) {
      setLog(prev => prev + '\nError: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>VPN Messenger</h2>
      <button onClick={toggleConnect}>
        {connected ? 'Disconnect VPN' : 'Connect VPN'}
      </button>
      <div style={{ marginTop: 12 }}>
        <label>Channel: </label>
        <select value={channel} onChange={e => setChannel(e.target.value)}>
          <option value="sms">SMS (Safaricom/Airtel)</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Recipients (space/newline separated, use +254... format):</label><br/>
        <textarea rows={4} style={{ width: '100%' }} value={recipientsText}
          onChange={e => setRecipientsText(e.target.value)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Message:</label><br/>
        <textarea rows={3} style={{ width: '100%' }} value={message}
          onChange={e => setMessage(e.target.value)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={send}>Send</button>
      </div>
      <pre style={{ marginTop: 12, background:'#f2f2f2', padding:10, height:200, overflow:'auto' }}>{log}</pre>
    </div>
  );
}
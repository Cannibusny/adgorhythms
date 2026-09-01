const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  return null;
}

async function sendTicketEmail(event, buyerName, buyerEmail, tickets, tierName) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Email not configured — skipping ticket email');
    return;
  }

  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const ticketCode = tickets[0].ticket_code;
  const qrData = JSON.stringify({ ticketCode, eventId: event.id, buyerName, buyerEmail });
  const qrBuffer = await QRCode.toBuffer(qrData, { width: 300, margin: 2 });

  const baseUrl = process.env.BASE_URL || '';
  const ticketUrl = `${baseUrl}/events/${event.id}/ticket/${ticketCode}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:2rem;">
    <div style="text-align:center;margin-bottom:2rem;">
      <h1 style="color:#6c5ce7;margin:0;">ADgorhythms</h1>
      <p style="color:#8888a0;margin:0.5rem 0 0;">Event Suite</p>
    </div>
    <div style="background:#12121a;border:1px solid #2a2a3a;border-radius:12px;padding:2rem;text-align:center;">
      <h2 style="color:#e0e0e8;margin:0 0 0.5rem;">You're In!</h2>
      <p style="color:#8888a0;margin:0 0 1.5rem;">Your ticket for <strong style="color:#e0e0e8;">${event.name}</strong> is confirmed</p>
      <div style="margin:1.5rem 0;">
        <img src="cid:qrcode" alt="QR Code Ticket" style="max-width:220px;border-radius:12px;background:#fff;padding:8px;" />
      </div>
      <div style="margin:1rem 0;">
        <span style="color:#8888a0;font-size:0.85rem;">Ticket Code</span><br/>
        <span style="font-family:monospace;color:#e0e0e8;font-size:1rem;">${ticketCode}</span>
      </div>
      ${tierName ? `<div style="margin:0.5rem 0;"><span style="background:rgba(108,92,231,0.15);color:#6c5ce7;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.85rem;font-weight:600;">${tierName}</span></div>` : ''}
      <hr style="border:none;border-top:1px solid #2a2a3a;margin:1.5rem 0;" />
      <table style="width:100%;text-align:left;color:#e0e0e8;font-size:0.9rem;">
        <tr><td style="padding:0.4rem 0;color:#8888a0;">Event</td><td style="padding:0.4rem 0;font-weight:600;">${event.name}</td></tr>
        <tr><td style="padding:0.4rem 0;color:#8888a0;">Date</td><td style="padding:0.4rem 0;">${dateStr}</td></tr>
        <tr><td style="padding:0.4rem 0;color:#8888a0;">Time</td><td style="padding:0.4rem 0;">${timeStr}</td></tr>
        <tr><td style="padding:0.4rem 0;color:#8888a0;">Location</td><td style="padding:0.4rem 0;">${event.location}</td></tr>
        <tr><td style="padding:0.4rem 0;color:#8888a0;">Name</td><td style="padding:0.4rem 0;">${buyerName}</td></tr>
        ${tickets.length > 1 ? `<tr><td style="padding:0.4rem 0;color:#8888a0;">Tickets</td><td style="padding:0.4rem 0;">${tickets.length}</td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #2a2a3a;margin:1.5rem 0;" />
      <p style="color:#8888a0;font-size:0.85rem;margin:0;">Show this QR code at the door for check-in.</p>
      <a href="${ticketUrl}" style="display:inline-block;margin-top:1rem;padding:0.75rem 2rem;background:#6c5ce7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Your Ticket</a>
    </div>
    <p style="text-align:center;color:#8888a0;font-size:0.75rem;margin-top:1.5rem;">Powered by ADgorhythms Event Suite</p>
  </div>
</body>
</html>`;

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'tickets@adgorhythms.com';

  await transporter.sendMail({
    from: `"ADgorhythms Events" <${fromEmail}>`,
    to: buyerEmail,
    subject: `Your Ticket for ${event.name}`,
    html,
    attachments: [{
      filename: 'ticket-qr.png',
      content: qrBuffer,
      cid: 'qrcode',
    }],
  });

  console.log(`Ticket email sent to ${buyerEmail}`);
}

module.exports = { sendTicketEmail };

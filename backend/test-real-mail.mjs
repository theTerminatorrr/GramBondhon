import nodemailer from "nodemailer";

async function testGmail() {
  console.log("Connecting to smtp.gmail.com:465 with binsadikmuhutasim@gmail.com...");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "binsadikmuhutasim@gmail.com",
      pass: "dpawmdzcnxzfjtbd"
    }
  });

  try {
    const info = await transporter.sendMail({
      from: '"GramBondhon Official" <binsadikmuhutasim@gmail.com>',
      to: "binsadikmuhutasim@gmail.com",
      subject: "🌾 [GramBondhon] Official Share Certificate & Blockchain Escrow Receipt",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:2px solid #10B981;border-radius:12px;background:#ffffff;">
          <div style="text-align:center;background:linear-gradient(135deg,#02221A,#064E3B);padding:20px;border-radius:8px;color:#fff;">
            <h2 style="margin:0 0 6px 0;color:#A7F3D0;">Official Investment Share Certificate</h2>
            <p style="margin:0;font-size:13px;color:#D1FAE5;">GramBandhan Rural Agri-FinTech Escrow Collective • Dhaka, Bangladesh</p>
          </div>
          <div style="padding:20px 0;">
            <p>Dear <strong>Rahat Khan</strong> (NID: 1988269120485921),</p>
            <p>Your investment in <strong>Red Chilli farming - 1</strong> has been successfully confirmed and sealed on the <strong>Base Sepolia blockchain</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:6px;color:#64748B;">Capital Committed:</td><td style="padding:6px;font-weight:bold;color:#047857;">৳ 20,000 BDT</td></tr>
              <tr><td style="padding:6px;color:#64748B;">Expected Return:</td><td style="padding:6px;font-weight:bold;color:#10B981;">৳ 3,640 BDT (+18.2%)</td></tr>
              <tr><td style="padding:6px;color:#64748B;">Payment Method:</td><td style="padding:6px;font-weight:bold;">bKash (TrxID: 1htdfrs)</td></tr>
              <tr><td style="padding:6px;color:#64748B;">Shariah Audit:</td><td style="padding:6px;font-weight:bold;color:#047857;">Verified Mudarabah 65/35</td></tr>
              <tr><td style="padding:6px;color:#64748B;">Network:</td><td style="padding:6px;font-weight:bold;">Base Sepolia (Chain ID 84532)</td></tr>
            </table>
            <div style="background:#ECFDF5;border:1px solid #10B981;padding:12px;border-radius:8px;font-size:12px;color:#065F46;">
              <strong>BaseScan Explorer:</strong> <a href="https://sepolia.basescan.org" style="color:#047857;font-weight:bold;">https://sepolia.basescan.org</a>
            </div>
          </div>
          <p style="font-size:12px;color:#94A3B8;text-align:center;">This is an automated real-time verification receipt sent to binsadikmuhutasim@gmail.com.</p>
        </div>
      `
    });
    console.log("SUCCESS! Real email sent! MessageId:", info.messageId);
    return true;
  } catch (err) {
    console.error("GMAIL SMTP ERROR:", err.message);
    return false;
  }
}

testGmail();

const LOGO_HEADER = `
  <div style="background-color:#0A1024;padding:28px 40px;text-align:center;border-bottom:3px solid #FFC917;">
    <span style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:900;letter-spacing:-0.5px;line-height:1;">
      <span style="color:#ffffff;">My</span><span style="color:#FFC917;">Prodigi</span>
    </span>
    <span style="display:block;font-family:Arial,sans-serif;font-size:10px;font-weight:600;color:#4B5563;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Platform Matchmaking Talenta Lomba</span>
  </div>`;

const FOOTER_HTML = `
  <div style="background-color:#F8F9FA;padding:24px 40px;border-top:1px solid #F0F0F0;text-align:center;">
    <p style="font-size:12px;color:#9CA3AF;line-height:1.6;margin:0;">
      Email ini dikirim otomatis oleh <strong style="color:#6B7280;">MyProdigi</strong>. Harap tidak membalas email ini.<br/>
      &copy; ${new Date().getFullYear()} MyProdigi &mdash; All rights reserved.
    </p>
  </div>`;

export function teamInviteEmailHtml({
  recipientName,
  leaderName,
  teamName,
  competitionTitle,
  category,
  teamLink,
  detailUrl,
}: {
  recipientName: string;
  leaderName: string;
  teamName: string;
  competitionTitle: string;
  category: string;
  teamLink: string;
  detailUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Undangan Tim - MyProdigi</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<div style="width:100%;background-color:#F0F2F5;padding:40px 16px;">
  <div style="max-width:580px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

    ${LOGO_HEADER}

    <div style="padding:36px 40px 28px;">

      <div style="display:inline-block;background-color:#FFF9E6;color:#92690A;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;margin:0 0 22px;letter-spacing:0.5px;">
        UNDANGAN TIM BARU
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0A1024;line-height:1.3;">
        Halo, ${recipientName}!
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.7;">
        <strong style="color:#0A1024;">${leaderName}</strong> mengundangmu bergabung ke sebuah tim lomba di MyProdigi.
        Lihat dulu detail tim dan CV anggotanya sebelum kamu memutuskan.
      </p>

      <div style="background:#F8F9FA;border-radius:10px;padding:20px 24px;margin:0 0 28px;border-left:4px solid #FFC917;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:5px 0;color:#6B7280;font-weight:600;width:100px;">Tim</td><td style="padding:5px 0;color:#0A1024;font-weight:700;">${teamName}</td></tr>
          <tr><td style="padding:5px 0;color:#6B7280;font-weight:600;">Ketua</td><td style="padding:5px 0;color:#0A1024;font-weight:600;">${leaderName}</td></tr>
          <tr><td style="padding:5px 0;color:#6B7280;font-weight:600;">Lomba</td><td style="padding:5px 0;color:#0A1024;">${competitionTitle}</td></tr>
          <tr><td style="padding:5px 0;color:#6B7280;font-weight:600;">Kategori</td><td style="padding:5px 0;color:#0A1024;">${category}</td></tr>
          <tr><td style="padding:5px 0;color:#6B7280;font-weight:600;">Link</td><td style="padding:5px 0;"><a href="${teamLink}" style="color:#FFC917;text-decoration:none;font-weight:600;">${teamLink}</a></td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${detailUrl}" style="display:inline-block;background-color:#FFC917;color:#0A1024;text-decoration:none;font-weight:800;font-size:15px;padding:14px 40px;border-radius:8px;letter-spacing:0.2px;">
          Lihat Detail Tim &amp; Anggota &#8594;
        </a>
      </div>

      <p style="font-size:12px;color:#9CA3AF;line-height:1.7;margin:0;text-align:center;">
        Kamu dapat melihat CV seluruh anggota sebelum memutuskan untuk bergabung.<br/>
        Tombol <strong>Terima / Tolak</strong> tersedia di halaman detail tim.
      </p>

      <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid #F0F0F0;">
        <p style="font-size:12px;color:#D1D5DB;margin:0;text-align:center;">
          Jika kamu tidak mengenal tim ini, cukup abaikan email ini.
        </p>
      </div>
    </div>

    ${FOOTER_HTML}
  </div>
</div>
</body>
</html>`;
}

export function verificationEmailHtml({
  recipientName,
  otpCode,
}: {
  recipientName: string;
  otpCode: string;
}): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Verifikasi Email - MyProdigi</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:Arial,Helvetica,sans-serif;">
<div style="width:100%;background-color:#F0F2F5;padding:40px 16px;">
  <div style="max-width:580px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

    ${LOGO_HEADER}

    <div style="padding:36px 40px 28px;">

      <div style="display:inline-block;background-color:#EFF6FF;color:#1E40AF;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;margin:0 0 22px;letter-spacing:0.5px;">
        VERIFIKASI AKUN
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0A1024;line-height:1.3;">
        Halo, ${recipientName}!
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6B7280;line-height:1.7;">
        Terima kasih telah mendaftar di <strong style="color:#0A1024;">MyProdigi</strong>.
        Masukkan kode OTP berikut di halaman pendaftaran untuk menyelesaikan proses registrasimu.
      </p>

      <div style="background-color:#0A1024;border-radius:12px;padding:28px 32px;margin:0 0 28px;text-align:center;border:2px solid #FFC917;">
        <p style="font-size:11px;font-weight:700;color:#4B5563;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">Kode Verifikasi</p>
        <span style="font-size:42px;font-weight:900;letter-spacing:16px;color:#FFC917;font-family:'Courier New',Courier,monospace;display:block;line-height:1;padding-left:16px;">${otpCode}</span>
        <p style="font-size:12px;color:#6B7280;margin:14px 0 0;">Berlaku selama <strong style="color:#FFC917;">15 menit</strong></p>
      </div>

      <div style="background:#FFF9E6;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
        <p style="font-size:13px;color:#92690A;margin:0;line-height:1.6;">
          <strong>Penting:</strong> Jangan bagikan kode ini kepada siapapun, termasuk tim MyProdigi.
        </p>
      </div>

      <p style="font-size:12px;color:#D1D5DB;margin:0;text-align:center;">
        Tidak merasa mendaftar di MyProdigi? Abaikan email ini &mdash; akunmu tidak akan dibuat.
      </p>
    </div>

    ${FOOTER_HTML}
  </div>
</div>
</body>
</html>`;
}

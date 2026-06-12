import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter;

export const initEmailService = async () => {
  if (process.env.BREVO_API_KEY) {
    console.log('Email service initialized with Brevo HTTP API (Bypass Firewall)');
    return; // Không cần khởi tạo Nodemailer
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Sử dụng SMTP thật từ .env (Thường dùng cho Local)
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Nodemailer initialized with SMTP credentials');
  } else {
    // Dùng Ethereal fake email để test local nếu chưa có cấu hình
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Nodemailer initialized with fake Ethereal account. Emails will not actually be sent to real addresses.');
    console.log(`Fake Email Credentials -> User: ${testAccount.user}, Pass: ${testAccount.pass}`);
  }
};

/**
 * Gửi email xin cấp quyền
 */
export const sendAccessRequestEmail = async ({
  toEmail,
  requesterName,
  categoryName,
  approvalLink
}) => {
  if (!transporter && !process.env.BREVO_API_KEY) await initEmailService();

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Yêu cầu cấp quyền truy cập</h2>
      <p style="font-size: 16px; color: #555;">
        Chào bạn,
      </p>
      <p style="font-size: 16px; color: #555;">
        Người dùng <strong>${requesterName}</strong> đang yêu cầu bạn cấp quyền truy cập vào danh mục khoá <strong>"${categoryName}"</strong> của bạn.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalLink}" style="background-color: #E60023; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 16px;">
          Phê duyệt yêu cầu
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">
        Nếu bạn không muốn cấp quyền cho người dùng này, bạn có thể bỏ qua email này.
      </p>
      <p style="font-size: 14px; color: #999;">
        Trân trọng,<br/>
        Pinterest Mini Team
      </p>
    </div>
  `;

  // 1. Nếu có BREVO_API_KEY -> Gửi qua cổng HTTP (443) cực kỳ an toàn, không bao giờ bị chặn
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { 
            name: 'Pinterest Mini', 
            email: process.env.SMTP_USER || 'no-reply@pinterestmini.com' 
          },
          to: [{ email: toEmail }],
          subject: `[Pinterest Mini] ${requesterName} xin cấp quyền xem danh mục ${categoryName}`,
          htmlContent: htmlTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API Error:', errorData);
        throw new Error('Lỗi gửi mail API');
      }

      console.log('Email sent successfully via Brevo HTTP API');
      return await response.json();
    } catch (error) {
      console.error('Error sending via Brevo:', error);
      throw new Error('Lỗi khi gửi email qua API HTTP');
    }
  }

  // 2. Nếu không dùng Brevo, chạy SMTP bình thường (thường dùng ở Local)
  try {
    const info = await transporter.sendMail({
      from: '"Pinterest Mini" <no-reply@pinterestmini.com>',
      to: toEmail,
      subject: `[Pinterest Mini] ${requesterName} xin cấp quyền xem danh mục ${categoryName}`,
      html: htmlTemplate,
    });

    console.log('Email sent via SMTP: %s', info.messageId);
    if (info.messageId && !process.env.SMTP_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    throw new Error('Lỗi khi gửi email (Timeout/SMTP blocked)');
  }
};

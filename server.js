const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Email credentials (use environment variables in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_NAME, // ⬅️ Replace with your email
    pass: process.env.PASSWORD, // ⬅️ Use app password if 2FA
  },
});

// POST endpoint to receive and email the signed NDA PDF
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const file = req.file;

    if (!name || !email || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send the email with PDF attachment
    const mailOptions = {
      from: '"NDA Bot" <your-email@gmail.com>',
      to: 'your-email@gmail.com', // ⬅️ Where you want to receive the NDA
      subject: `New NDA Signed by ${name}`,
      text: `A new NDA was signed by ${name} (${email}). See attached PDF.`,
      attachments: [
        {
          filename: `${name.replace(/\s+/g, '_')}.pdf`,
          content: file.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 NDA emailed for: ${name}`);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('❌ Email failed:', err);
    res.status(500).json({ error: 'Email failed to send' });
  }
});

// Start the local server
app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});

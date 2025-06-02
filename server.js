const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve frontend assets

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_NAME,
    pass: process.env.PASSWORD,
  },
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const file = req.file;

    if (!name || !email || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mailOptions = {
      from: `"NDA Bot" <${process.env.USER_NAME}>`,
      to: process.env.RECEIVER_EMAIL || process.env.USER_NAME,
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

// Serve index.html for all unknown routes (for GitHub Pages/SPA routing fallback)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

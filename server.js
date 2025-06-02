// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public')); // serve HTML and frontend files

// Ensure the output folder exists
const outputDir = path.join(__dirname, 'signed-ndas');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Save PDF to local server
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    const filename = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    console.log(`✅ NDA saved at: ${filepath}`);
    res.status(200).send({ message: 'NDA saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

// Start the local server
app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});

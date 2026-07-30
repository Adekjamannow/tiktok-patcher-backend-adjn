const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', msg: 'Backend online' });
});

app.post('/api/ffmpeg-cleanup', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }
  
  console.log(`Received: ${req.file.size} bytes`);
  
  // Just echo back the file for now (no FFmpeg)
  res.setHeader('Content-Type', 'video/mp4');
  res.send(req.file.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});

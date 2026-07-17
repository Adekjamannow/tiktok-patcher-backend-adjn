const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TikTok Patcher Backend running' });
});

// FFmpeg cleanup endpoint
app.post('/api/ffmpeg-cleanup', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const inputPath = path.join('/tmp', `input_${Date.now()}.mp4`);
  const outputPath = path.join('/tmp', `output_${Date.now()}.mp4`);

  try {
    // Write buffer to file
    fs.writeFileSync(inputPath, req.file.buffer);

    // Run FFmpeg: stream copy + movflags faststart
    ffmpeg(inputPath)
      .outputOptions(['-c', 'copy', '-movflags', '+faststart'])
      .output(outputPath)
      .on('end', () => {
        // Read output and send back
        const outputBuffer = fs.readFileSync(outputPath);
        
        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="cleaned_${Date.now()}.mp4"`);
        res.send(outputBuffer);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        res.status(500).json({ error: 'FFmpeg processing failed: ' + err.message });
      })
      .run();

  } catch (err) {
    console.error('Error:', err);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

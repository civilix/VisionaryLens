const express = require('express');
const path = require('path');

const app = express();

app.use('/api/samples', (req, res) => {
  const fileName = req.path.substring(1);
  const filePath = path.join(__dirname, 'example_data', fileName);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('文件发送错误:', err);
      res.status(404).send('文件未找到');
    }
  });
});

app.use('/api/samples', require('./routes/samples')); 
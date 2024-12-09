const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../example_data', fileName);
  
  try {
    res.sendFile(filePath);
  } catch (error) {
    console.error('读取示例文件错误:', error);
    res.status(500).json({ error: '读取示例文件失败' });
  }
});

module.exports = router; 
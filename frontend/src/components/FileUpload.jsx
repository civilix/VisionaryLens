import React, { useState } from 'react';
import { Upload, message, Button, Space, Row, Col } from 'antd';
import { InboxOutlined, ReloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;

const sampleFiles = [
  'Real-estate-valuation-data-set.xlsx',
  'ad-data.xlsx',
  'winequality-red.csv'
];

const FileUpload = ({ onDataLoaded }) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Force read first row as headers
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const headers = [];
        for(let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({r:0, c:C})];
          headers[C] = cell ? cell.v : '';
        }

        // Read data rows
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: headers,
          range: 1  // Start reading from second row
        }).map(row => headers.map(header => row[header] || ''));

        // Combine headers and data
        const processedData = [
          headers,
          ...rows
        ];

        if (processedData.length > 1) {
          onDataLoaded(processedData);
          setFileUploaded(true);
          setFileName(file.name);
          message.success('文件上传成功');
        } else {
          message.error('文件中没有有效数据');
        }
      } catch (error) {
        console.error('文件解析错误:', error);
        message.error('文件解析失败');
      }
    };

    reader.onerror = () => {
      message.error('文件读取失败');
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  const loadSampleFile = async (fileName) => {
    try {
      const response = await fetch(`/api/samples/${fileName}`);
      if (!response.ok) {
        throw new Error('加载示例文件失败');
      }
      
      const jsonData = await response.json();
      
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }
      
      const { headers, data, numeric_columns, categorical_columns } = jsonData;
      
      // 组合表头和数据
      const processedData = [headers, ...data];
      
      if (processedData.length > 1) {
        onDataLoaded(processedData, {
          numeric_columns,
          categorical_columns
        });
        setFileUploaded(true);
        setFileName(`示例文件: ${fileName}`);
        message.success('示例文件加载成功');
      } else {
        message.error('文件中没有有效数据');
      }
      
    } catch (error) {
      console.error('加载示例文件错误:', error);
      message.error('加载示例文件失败');
    }
  };

  const handleReset = () => {
    setFileUploaded(false);
    setFileName('');
    onDataLoaded([]);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    beforeUpload: handleFile,
  };

  if (fileUploaded) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px',
        background: '#fafafa',
        border: '1px dashed #d9d9d9',
        borderRadius: '2px'
      }}>
        <p>当前文件：{fileName}</p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleReset}
        >
          重新上传
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域</p>
          <p className="ant-upload-hint">
            支持 Excel 文件 (.xlsx, .xls) 或 CSV 文件上传
          </p>
        </Dragger>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ marginBottom: '8px', color: '#666' }}>或者载入示例文件：</p>
          <Row gutter={[8, 8]}>
            {sampleFiles.map((fileName) => (
              <Col key={fileName}>
                <Button 
                  icon={<FileExcelOutlined />}
                  onClick={() => loadSampleFile(fileName)}
                >
                  {fileName}
                </Button>
              </Col>
            ))}
          </Row>
        </div>
      </Space>
    </div>
  );
};

export default FileUpload; 
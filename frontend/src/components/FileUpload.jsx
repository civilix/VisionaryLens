import React, { useState } from 'react';
import { Upload, message, Button, Space, Row, Col } from 'antd';
import { InboxOutlined, ReloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx-js-style';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axios';

const { Dragger } = Upload;

const sampleFiles = [
  'Real-estate-valuation-data-set.xlsx',
  'ad-data.xlsx',
  'winequality-red.csv'
];

const FileUpload = ({ onDataLoaded }) => {
  const { t } = useTranslation();
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
          message.success(t('fileUpload.uploadSuccess'));
        } else {
          message.error(t('fileUpload.noData'));
        }
      } catch (error) {
        console.error('文件解析错误:', error);
        message.error(t('fileUpload.uploadError'));
      }
    };

    reader.onerror = () => {
      message.error(t('fileUpload.readError'));
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  const loadSampleFile = async (fileName) => {
    try {
      const { data: jsonData } = await axios.get(`/api/samples/${fileName}`);
      
      const { headers, data, numeric_columns, categorical_columns } = jsonData;
      
      // 组合表头和数据
      const processedData = [headers, ...data];
      
      if (processedData.length > 1) {
        onDataLoaded(processedData, {
          numeric_columns,
          categorical_columns
        });
        setFileUploaded(true);
        setFileName(`${t('fileUpload.sampleFilePrefix')}${fileName}`);
        message.success(t('fileUpload.loadSampleSuccess'));
      } else {
        message.error(t('fileUpload.noData'));
      }
      
    } catch (error) {
      console.error('加载示例文件错误:', error);
      message.error(t('fileUpload.loadSampleError'));
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
        <p>{ t('fileUpload.currentFile') }{fileName}</p>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleReset}
        >
          { t('fileUpload.reupload') }
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
          <p className="ant-upload-text">{ t('fileUpload.dragText') }</p>
          <p className="ant-upload-hint">
            { t('fileUpload.supportText') }
          </p>
        </Dragger>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ marginBottom: '8px', color: '#666' }}>{ t('fileUpload.sampleFiles') }</p>
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
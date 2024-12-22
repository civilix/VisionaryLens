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
    const formData = new FormData();
    formData.append('file', file);

    axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      const { data, numeric_columns, categorical_columns } = response.data;
      onDataLoaded(data, {
        numeric_columns,
        categorical_columns
      });
      setFileUploaded(true);
      setFileName(file.name);
      message.success(t('fileUpload.uploadSuccess'));
    })
    .catch(error => {
      console.error('File upload error:', error);
      message.error(t('fileUpload.uploadError'));
    });

    return false;
  };

  const loadSampleFile = async (fileName) => {
    try {
      const { data: jsonData } = await axios.get(`/api/samples/${fileName}`);
      
      const { headers, data, numeric_columns, categorical_columns } = jsonData;
      
      // Combine headers and data
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
      console.error('Error loading sample file:', error);
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
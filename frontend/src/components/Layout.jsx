import React, { useState } from 'react';
import { Layout as AntLayout, Tabs, Button, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import Header from './Header';
import FileUpload from './FileUpload';
import DataPreview from './DataPreview';

const { Content } = AntLayout;
const { TabPane } = Tabs;

const Layout = () => {
  const [previewData, setPreviewData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleDataLoad = (response) => {
    setPreviewData(response.preview);
    setColumns(response.columns);
    setFullData(response.data);
    setShowAnalysis(true);
  };

  const handleCancel = () => {
    setPreviewData([]);
    setColumns([]);
    setFullData([]);
    setShowAnalysis(false);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: 360 }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <FileUpload onSuccess={handleDataLoad} />
            {showAnalysis && (
              <Button 
                type="primary" 
                danger 
                icon={<CloseOutlined />}
                onClick={handleCancel}
              >
                取消分析
              </Button>
            )}
          </Space>
          
          <DataPreview data={previewData} columns={columns} />
          
          {showAnalysis && (
            <Tabs defaultActiveKey="visualization" style={{ marginTop: 20 }}>
              <TabPane tab="数据可视化" key="visualization">
                数据可视化内容
              </TabPane>
              <TabPane tab="回归分析" key="regression">
                回归分析内容
              </TabPane>
              <TabPane tab="分类分析" key="classification">
                分类分析内容
              </TabPane>
            </Tabs>
          )}
        </div>
      </Content>
    </AntLayout>
  );
};

export default Layout; 
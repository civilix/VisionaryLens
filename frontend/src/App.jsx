import React, { useState, useMemo } from 'react';
import { Layout, Tabs, Card } from 'antd';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import Visualization from './components/Visualization';
import RegressionAnalysis from './components/RegressionAnalysis';
import ClassificationAnalysis from './components/ClassificationAnalysis';
import Header from './components/Header';

const { Content } = Layout;

const App = () => {
  const [data, setData] = useState(null);
  const [numericColumns, setNumericColumns] = useState([]);
  const [categoricalColumns, setCategoricalColumns] = useState([]);

  const handleDataLoaded = (newData, metadata) => {
    setData(newData);
    setNumericColumns(metadata.numeric_columns || []);
    setCategoricalColumns(metadata.categorical_columns || []);
  };

  const items = useMemo(() => [
    {
      key: '1',
      label: '可视化',
      children: data && (
        <Visualization 
          data={data} 
          numeric_columns={numericColumns}
          categorical_columns={categoricalColumns}
        />
      )
    },
    {
      key: '2',
      label: '回归分析',
      children: data && <RegressionAnalysis data={data} />
    },
    {
      key: '3',
      label: '分类分析',
      children: data && <ClassificationAnalysis data={data} />
    }
  ], [data, numericColumns, categoricalColumns]);

  return (
    <Layout>
      <Header />
      <Content style={{ padding: '24px' }}>
        <FileUpload onDataLoaded={handleDataLoaded} />
        
        {data && data.length > 0 && (
          <>
            <Card 
              title="数据预览" 
              style={{ 
                marginTop: '24px',
                marginBottom: '24px'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <DataPreview data={data} />
            </Card>

            <Card>
              <Tabs 
                defaultActiveKey="1"
                items={items}
              />
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default App; 
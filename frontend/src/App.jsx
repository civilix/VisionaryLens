import React, { useState, useMemo } from 'react';
import { Layout, Tabs, Card } from 'antd';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import Visualization from './components/Visualization';
import RegressionAnalysis from './components/RegressionAnalysis';
import ClassificationAnalysis from './components/ClassificationAnalysis';
import Header from './components/Header';
import { useTranslation } from 'react-i18next';

const { Content } = Layout;

const App = () => {
  const { t } = useTranslation();
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
      label: t('visualization'),
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
      label: t('regression'),
      children: data && <RegressionAnalysis data={data} />
    },
    {
      key: '3',
      label: t('classification'),
      children: data && <ClassificationAnalysis data={data} />
    }
  ], [data, numericColumns, categoricalColumns, t]);

  return (
    <Layout>
      <Header />
      <Content style={{ padding: '24px' }}>
        <FileUpload onDataLoaded={handleDataLoaded} />
        
        {data && data.length > 0 && (
          <>
            <Card 
              title={t('dataPreview')}
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
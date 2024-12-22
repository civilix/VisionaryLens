import React, { useState } from 'react';
import { Button, Card, Space, Select, Tabs } from 'antd';
import Plot from 'react-plotly.js';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TabPane } = Tabs;

const ModelAnalysis = ({ data, numeric_columns, categorical_columns }) => {
  const { t } = useTranslation();
  const [targetColumn, setTargetColumn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  const handleAnalysis = () => {
    setLoading(true);
    fetch('/api/model-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [], // Empty data for testing
        target_column: targetColumn,
        problem_type: 'regression',
        numeric_columns: numeric_columns,
        categorical_columns: categorical_columns
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Model Analysis Result:', data);
      setModelData(data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  };

  const renderPlot = () => {
    const traces = modelData.map(model => ({
      y: model.performance[selectedMetric],
      type: 'box',
      name: model.model_name
    }));

    return (
      <Plot
        data={traces}
        layout={{ title: `Model Performance - ${selectedMetric.toUpperCase()}` }}
      />
    );
  };

  return (
    <Card title={t('modelAnalysis.title')}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder={t('modelAnalysis.selectTarget')}
            onChange={setTargetColumn}
            value={targetColumn}
          >
            {numeric_columns.concat(categorical_columns).map((col) => (
              <Option key={col} value={col}>
                {col}
              </Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            onClick={handleAnalysis}
            loading={loading}
            disabled={!targetColumn}
          >
            {t('modelAnalysis.analyze')}
          </Button>
        </Space>
        {modelData.length > 0 && (
          <Tabs defaultActiveKey="accuracy" onChange={setSelectedMetric}>
            <TabPane tab="Accuracy" key="accuracy">
              {renderPlot()}
            </TabPane>
            <TabPane tab="Precision" key="precision">
              {renderPlot()}
            </TabPane>
            <TabPane tab="F1" key="f1">
              {renderPlot()}
            </TabPane>
            <TabPane tab="RMSE" key="rmse">
              {renderPlot()}
            </TabPane>
          </Tabs>
        )}
      </Space>
    </Card>
  );
};

export default ModelAnalysis; 
import React, { useState } from 'react';
import { Card, Select, Button, Space, Table, Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const ModelAnalysis = ({ data, numeric_columns, categorical_columns }) => {
  const { t } = useTranslation();
  const [targetColumn, setTargetColumn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelResults, setModelResults] = useState(null);

  // Extract column names from data
  const columnNames = data && data.length > 0 ? data[0] : [];
  
  // Determine problem type based on target column
  const getProblemType = (column) => {
    if (!column) return null;
    return categorical_columns.includes(column) ? 'classification' : 'regression';
  };

  const handleAnalysis = async () => {
    if (!targetColumn) {
      message.warning(t('modelAnalysis.selectTarget'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/model-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data.slice(1), // Exclude header row
          columns: columnNames,
          target_column: targetColumn,
          problem_type: getProblemType(targetColumn),
          numeric_columns,
          categorical_columns,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const results = await response.json();
      setModelResults(results);
    } catch (error) {
      console.error('Analysis error:', error);
      message.error(t('modelAnalysis.error'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('modelAnalysis.modelName'),
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: t('modelAnalysis.baselineScore'),
      dataIndex: 'baseline_score',
      key: 'baseline_score',
      render: (value) => value.toFixed(4),
    },
    {
      title: t('modelAnalysis.optimizedScore'),
      dataIndex: 'optimized_score',
      key: 'optimized_score',
      render: (value) => value.toFixed(4),
    },
    {
      title: t('modelAnalysis.improvement'),
      dataIndex: 'improvement',
      key: 'improvement',
      render: (value) => `${(value * 100).toFixed(2)}%`,
    },
  ];

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
            {columnNames.map((col) => (
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

        {targetColumn && (
          <Card size="small" style={{ marginTop: 16 }}>
            <p>
              {t('modelAnalysis.problemType')}: {' '}
              <strong>
                {getProblemType(targetColumn) === 'classification' 
                  ? t('modelAnalysis.classification') 
                  : t('modelAnalysis.regression')}
              </strong>
            </p>
          </Card>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip={t('modelAnalysis.loading')} />
          </div>
        )}

        {modelResults && (
          <Table 
            dataSource={modelResults.models} 
            columns={columns}
            pagination={false}
            style={{ marginTop: 16 }}
          />
        )}
      </Space>
    </Card>
  );
};

export default ModelAnalysis; 
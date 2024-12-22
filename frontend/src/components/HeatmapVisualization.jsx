import React, { useState, useMemo } from 'react';
import { Card, Space, Spin, message, Switch, Slider, Row, Col } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axios';

const HeatmapVisualization = ({ data, numeric_columns }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showThreshold, setShowThreshold] = useState(true);
  const [correlationThreshold, setCorrelationThreshold] = useState(0);

  // Extract column names and process data
  const { processedData, columnNames } = useMemo(() => {
    if (!data || !data.length) return { processedData: [], columnNames: [] };
    const names = data[0];
    const processed = data.slice(1);
    return { processedData: processed, columnNames: names };
  }, [data]);

  // Calculate correlations
  const calculateCorrelations = useMemo(() => {
    if (!processedData.length || !numeric_columns.length) return null;

    // Create numeric column data matrix
    const numericData = numeric_columns.map(col => {
      const colIndex = columnNames.indexOf(col);
      return processedData.map(row => Number(row[colIndex]));
    });

    // Calculate correlation matrix
    return numeric_columns.map((_, i) => {
      return numeric_columns.map((_, j) => {
        if (i === j) return 1;
        const x = numericData[i].filter((val, idx) => 
          !isNaN(val) && !isNaN(numericData[j][idx]));
        const y = numericData[j].filter((val, idx) => 
          !isNaN(val) && !isNaN(numericData[i][idx]));
        
        if (x.length === 0) return 0;

        const xMean = x.reduce((a, b) => a + b) / x.length;
        const yMean = y.reduce((a, b) => a + b) / y.length;
        
        const numerator = x.reduce((sum, xi, idx) => 
          sum + (xi - xMean) * (y[idx] - yMean), 0);
        const denominator = Math.sqrt(
          x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) *
          y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
        );

        return denominator === 0 ? 0 : numerator / denominator;
      });
    });
  }, [processedData, numeric_columns, columnNames]);

  // Heatmap data configuration
  const heatmapData = useMemo(() => {
    if (!calculateCorrelations) return [];

    return [{
      type: 'heatmap',
      z: calculateCorrelations,
      x: numeric_columns,
      y: numeric_columns,
      colorscale: 'RdBu',
      zmin: -1,
      zmax: 1,
      hoverongaps: false,
      showscale: true,
      colorbar: {
        title: t('visualization.correlation.coefficient'),
        titleside: 'right',
        thickness: 20,
        len: 0.9,
      },
      text: calculateCorrelations.map((row, i) =>
        row.map((val, j) => 
          `${numeric_columns[i]} - ${numeric_columns[j]}<br>${val.toFixed(2)}`
        )
      ),
      hoverinfo: 'text'
    }];
  }, [calculateCorrelations, numeric_columns, t]);

  // Heatmap layout configuration
  const heatmapLayout = useMemo(() => ({
    autosize: true,
    margin: {
      l: 100,  // 左边距
      r: 50,   // 右边距
      t: 50,   // 上边距
      b: 100   // 下边距
    },
    title: t('visualization.correlation.title'),
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    height: undefined,  // 让高度自动计算
    xaxis: {
      tickangle: 45,    // 调整 x 轴标签角度
      automargin: true, // 自动调整边距
    },
    yaxis: {
      automargin: true, // 自动调整边距
    },
    annotations: calculateCorrelations?.map((row, i) =>
      row.map((val, j) => ({
        text: val.toFixed(2),
        x: numeric_columns[j],
        y: numeric_columns[i],
        xref: 'x',
        yref: 'y',
        showarrow: false,
        font: {
          color: Math.abs(val) > 0.5 ? 'white' : 'black',
          size: 10
        }
      }))
    ).flat() || []
  }), [calculateCorrelations, numeric_columns, t]);

  return (
    <div>
      {numeric_columns.length >= 2 ? (
        <Card>
          <Row 
            align="middle" 
            style={{ 
              marginBottom: 16,
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px'
            }}
          >
            <Col span={8}>
              <Space>
                <span style={{ fontWeight: 500 }}>{t('visualization.filter.low.correlation')}:</span>
                <Switch 
                  checked={showThreshold}
                  onChange={setShowThreshold}
                  style={{ backgroundColor: showThreshold ? '#1890ff' : undefined }}
                />
              </Space>
            </Col>
            {showThreshold && (
              <Col span={16}>
                <Space align="center" style={{ width: '100%' }}>
                  <span style={{ fontWeight: 500, minWidth: '60px' }}>{t('visualization.threshold')}:</span>
                  <Slider
                    value={correlationThreshold}
                    onChange={setCorrelationThreshold}
                    min={0}
                    max={1}
                    step={0.05}
                    style={{ width: '200px', margin: '0 10px' }}
                    tooltip={{
                      formatter: value => `${value.toFixed(2)}`
                    }}
                  />
                  <span style={{ minWidth: '60px' }}>
                    {correlationThreshold.toFixed(2)}
                  </span>
                </Space>
              </Col>
            )}
          </Row>
          <div className="visualization-container">
            <Spin spinning={loading}>
              <Plot
                data={heatmapData}
                layout={heatmapLayout}
                config={{
                  displayModeBar: true,
                  responsive: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: 'Correlation Heatmap',
                    height: 1000,
                    width: 1000,
                    scale: 2
                  }
                }}
                style={{ 
                  width: '100%',
                  height: '100%',
                  minHeight: '500px',
                  maxHeight: '80vh'  // 限制最大高度为视窗高度的 80%
                }}
                useResizeHandler={true}
                onError={() => message.error('绘制热图时出错')}
              />
            </Spin>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>需要至少两个数值型特征来生成相关性热图</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HeatmapVisualization; 
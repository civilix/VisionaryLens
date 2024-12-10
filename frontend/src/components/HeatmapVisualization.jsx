import React, { useState, useMemo } from 'react';
import { Card, Space, Spin, message, Switch, Slider, Row, Col } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';

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
    if (!calculateCorrelations) return null;

    const filteredZ = calculateCorrelations.map(row =>
      row.map(val => 
        showThreshold && Math.abs(val) < correlationThreshold ? null : val
      )
    );

    return [{
      type: 'heatmap',
      z: filteredZ,
      x: numeric_columns,
      y: numeric_columns,
      colorscale: [
        [0, '#2166ac'],      // Dark blue
        [0.25, '#92c5de'],   // Light blue
        [0.5, '#f7f7f7'],    // White
        [0.75, '#fdb863'],   // Orange
        [1, '#b2182b']       // Red
      ],
      zmin: -1,
      zmax: 1,
      hoverongaps: false,
      showscale: true,
      colorbar: {
        title: '相关系数',
        titleside: 'right',
        thickness: 15,
        len: 0.5,
        y: 0.5,
        tickformat: '.2f',
        tickmode: 'array',
        tickvals: [-1, -0.5, 0, 0.5, 1],
        ticktext: ['-1.00', '-0.50', '0.00', '0.50', '1.00']
      },
      hovertemplate: 
        '<b>%{y}</b> 与 <b>%{x}</b><br>' +
        '相关系数: %{z:.3f}<br>' +
        '<extra></extra>'
    }];
  }, [calculateCorrelations, numeric_columns, showThreshold, correlationThreshold]);

  // Heatmap layout configuration
  const heatmapLayout = useMemo(() => ({
    title: {
      text: '特征相关性热图',
      font: {
        size: 20,
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial'
      },
      y: 0.95
    },
    autosize: true,
    height: 800,
    margin: { l: 120, r: 80, t: 80, b: 120 },
    xaxis: {
      tickangle: 45,
      side: 'bottom',
      tickfont: { size: 11 },
      gridcolor: '#f0f0f0',
      linecolor: '#e0e0e0'
    },
    yaxis: {
      autorange: 'reversed',
      tickfont: { size: 11 },
      gridcolor: '#f0f0f0',
      linecolor: '#e0e0e0'
    },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    annotations: calculateCorrelations?.map((row, i) =>
      row.map((val, j) => ({
        text: (!showThreshold || Math.abs(val) >= correlationThreshold) 
          ? val.toFixed(2) 
          : '',
        x: numeric_columns[j],
        y: numeric_columns[i],
        xref: 'x',
        yref: 'y',
        showarrow: false,
        font: {
          family: 'Arial',
          size: 10,
          color: Math.abs(val) > 0.5 ? 'white' : 'black',
          weight: Math.abs(val) > 0.7 ? 'bold' : 'normal'
        }
      }))
    ).flat() || []
  }), [calculateCorrelations, numeric_columns, showThreshold, correlationThreshold]);

  return (
    <div>
      {numeric_columns.length > 1 ? (
        <Card style={{ backgroundColor: '#f7f7f7' }}>
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
                <span style={{ fontWeight: 500 }}>过滤低相关性：</span>
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
                  <span style={{ fontWeight: 500, minWidth: '60px' }}>阈值：</span>
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
                  minHeight: '800px'
                }}
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
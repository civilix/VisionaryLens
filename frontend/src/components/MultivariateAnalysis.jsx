import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Radio, Spin, message, Select, Row, Col, Button, Typography } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { Option } = Select;

// 定义变换选项
const transformOptions = [
  { value: 'x', label: 'x' },
  { value: 'x^2', label: 'x²' },
  { value: 'log10(x)', label: 'log₁₀(x)' },
  { value: 'log10(x+1)', label: 'log₁₀(x+1)' },
  { value: 'ln(x)', label: 'ln(x)' },
  { value: 'ln(x+1)', label: 'ln(x+1)' }
];

const MultivariateAnalysis = ({ data, numeric_columns, categorical_columns }) => {
  const { t } = useTranslation();
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [xTransformation, setXTransformation] = useState('x');
  const [yTransformation, setYTransformation] = useState('x');
  const [chartType, setChartType] = useState('scatter');
  const [loading, setLoading] = useState(false);

  // 获取列的类型
  const getColumnType = (column) => {
    return numeric_columns.includes(column) ? 'numeric' : 'categorical';
  };

  // 根据选择的列类型确定可用的图表类型
  const availableChartTypes = useMemo(() => {
    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);

    if (!xColumn || !yColumn) return [];

    if (xType === 'numeric' && yType === 'numeric') {
      return [
        { value: 'scatter', label: t('visualization.charts.scatterPlot') },
        { value: 'line', label: t('visualization.charts.linePlot') }
      ];
    } else if (xType === 'categorical' && yType === 'numeric') {
      return [
        { value: 'box', label: t('visualization.charts.boxPlot') },
        { value: 'violin', label: t('visualization.charts.violinPlot') },
        { value: 'bar', label: t('visualization.charts.barPlot') }
      ];
    } else if (xType === 'numeric' && yType === 'categorical') {
      return [
        { value: 'box', label: t('visualization.charts.boxPlot') },
        { value: 'violin', label: t('visualization.charts.violinPlot') }
      ];
    } else {
      return [
        { value: 'heatmap', label: t('visualization.charts.heatmapPlot') },
        { value: 'bar', label: t('visualization.charts.barPlot') }
      ];
    }
  }, [xColumn, yColumn, t]);

  // 当可用图表类型改变时，自动选择第一个可用的图表类型
  useEffect(() => {
    if (availableChartTypes.length > 0) {
      setChartType(availableChartTypes[0].value);
    }
  }, [availableChartTypes]);

  // 处理数据并创建图表
  const processData = useMemo(() => {
    if (!data || !xColumn || !yColumn) return null;

    const columnNames = data[0];
    const xIndex = columnNames.indexOf(xColumn);
    const yIndex = columnNames.indexOf(yColumn);
    const processedData = data.slice(1);

    // 根据变量类型和转换方式处理数据
    const transformValue = (value, transformation) => {
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      
      switch (transformation) {
        case 'x^2': return num * num;
        case 'log10(x)': return num > 0 ? Math.log10(num) : null;
        case 'log10(x+1)': return Math.log10(num + 1);
        case 'ln(x)': return num > 0 ? Math.log(num) : null;
        case 'ln(x+1)': return Math.log(num + 1);
        default: return num;
      }
    };

    const xValues = processedData.map(row => transformValue(row[xIndex], xTransformation));
    const yValues = processedData.map(row => transformValue(row[yIndex], yTransformation));

    // 根据图表类型创建不同的数据结构
    switch (chartType) {
      case 'scatter':
      case 'line':
        return [{
          type: chartType,
          x: xValues,
          y: yValues,
          mode: chartType === 'line' ? 'lines+markers' : 'markers',
          marker: { color: '#1890ff' }
        }];
      
      case 'box':
      case 'violin':
        return [{
          type: chartType,
          x: xValues,
          y: yValues,
          box: {
            visible: true
          },
          line: {
            color: '#1890ff'
          },
          meanline: {
            visible: true
          }
        }];
      
      case 'bar':
        // 对分类数据进行计数
        const counts = {};
        xValues.forEach((x, i) => {
          const key = `${x}-${yValues[i]}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        
        return [{
          type: 'bar',
          x: Object.keys(counts).map(k => k.split('-')[0]),
          y: Object.values(counts),
          marker: { color: '#1890ff' }
        }];
      
      case 'heatmap':
        // 创建热力图数据
        const heatmapData = {};
        xValues.forEach((x, i) => {
          if (!heatmapData[x]) heatmapData[x] = {};
          heatmapData[x][yValues[i]] = (heatmapData[x][yValues[i]] || 0) + 1;
        });
        
        const uniqueX = [...new Set(xValues)];
        const uniqueY = [...new Set(yValues)];
        const zValues = uniqueX.map(x => 
          uniqueY.map(y => heatmapData[x]?.[y] || 0)
        );
        
        return [{
          type: 'heatmap',
          x: uniqueX,
          y: uniqueY,
          z: zValues,
          colorscale: 'YlOrRd'
        }];
      
      default:
        return null;
    }
  }, [data, xColumn, yColumn, xTransformation, yTransformation, chartType]);

  // 图表布局配置
  const layout = useMemo(() => ({
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: false,
    title: {
      text: `${yColumn} vs ${xColumn}`,
      font: { size: 16 }
    },
    xaxis: {
      title: xColumn,
      type: getColumnType(xColumn) === 'numeric' ? 'linear' : 'category'
    },
    yaxis: {
      title: yColumn,
      type: getColumnType(yColumn) === 'numeric' ? 'linear' : 'category'
    }
  }), [xColumn, yColumn]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16}>
            {/* X轴变量选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">X轴变量:</span>
                <div className="feature-content">
                  <Select
                    value={xColumn}
                    onChange={setXColumn}
                    style={{ width: '100%' }}
                    placeholder="选择X轴变量"
                  >
                    {numeric_columns.map(col => (
                      <Option key={col} value={col}>{col}</Option>
                    ))}
                  </Select>
                </div>
              </div>
            </Col>
            
            {/* X轴变换选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">X轴变换:</span>
                <div className="feature-content">
                  <Select
                    value={xTransformation}
                    onChange={setXTransformation}
                    style={{ width: '100%' }}
                    placeholder="选择X轴变换"
                  >
                    {transformOptions.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </div>
              </div>
            </Col>

            {/* Y轴变量选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">Y轴变量:</span>
                <div className="feature-content">
                  <Select
                    value={yColumn}
                    onChange={setYColumn}
                    style={{ width: '100%' }}
                    placeholder="选择Y轴变量"
                  >
                    {numeric_columns.map(col => (
                      <Option key={col} value={col}>{col}</Option>
                    ))}
                  </Select>
                </div>
              </div>
            </Col>

            {/* Y轴变换选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">Y轴变换:</span>
                <div className="feature-content">
                  <Select
                    value={yTransformation}
                    onChange={setYTransformation}
                    style={{ width: '100%' }}
                    placeholder="选择Y轴变换"
                  >
                    {transformOptions.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </div>
              </div>
            </Col>
          </Row>

          {/* 图表类型选择 */}
          {availableChartTypes.length > 0 && (
            <div className="feature-row">
              <span className="feature-label">{t('visualization.chartType')}:</span>
              <div className="feature-content">
                <Radio.Group 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  className="radio-group"
                >
                  {availableChartTypes.map(type => (
                    <Radio.Button 
                      key={type.value} 
                      value={type.value}
                      className="radio-button"
                    >
                      {type.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            </div>
          )}
        </Space>
      </Card>

      {/* 图表显示 */}
      <Card>
        <div style={{ height: '600px' }}>
          <Spin spinning={loading}>
            {processData ? (
              <Plot
                data={processData}
                layout={layout}
                config={{
                  displayModeBar: true,
                  responsive: true,
                  displaylogo: false
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Text type="secondary">请选择要分析的变量</Text>
              </div>
            )}
          </Spin>
        </div>
      </Card>
    </div>
  );
};

export default MultivariateAnalysis; 
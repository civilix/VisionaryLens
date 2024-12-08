import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Radio, Spin, message, Switch, InputNumber, Row, Col } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';

const Visualization = ({ data, numeric_columns, categorical_columns }) => {
  const [chartType, setChartType] = useState('');
  const [currentColumn, setCurrentColumn] = useState('');
  const [transformation, setTransformation] = useState('x');
  const [loading, setLoading] = useState(false);
  const [plotData, setPlotData] = useState(null);
  const [showThreshold, setShowThreshold] = useState(false);
  const [correlationThreshold, setCorrelationThreshold] = useState(0.5);

  // 添加调试日志
  useEffect(() => {
    console.log('数据检查:', {
      data: data,
      numeric_columns: numeric_columns,
      categorical_columns: categorical_columns
    });
  }, [data, numeric_columns, categorical_columns]);

  // 自定义布局配置
  const layout = useMemo(() => ({
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: true,
    title: {
      text: currentColumn ? `${currentColumn}` : '',
      font: { size: 16 }
    },
    paper_bgcolor: 'white',
    plot_bgcolor: '#fafafa',
    xaxis: {
      title: currentColumn,
      gridcolor: '#eee',
      zeroline: false
    },
    yaxis: {
      title: '频次',
      gridcolor: '#eee',
      zeroline: false
    },
    font: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      size: 12
    },
    // 饼图特殊配置
    ...(chartType === 'pie' ? {
      height: 500,
      piecolorway: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ]
    } : {})
  }), [currentColumn, chartType]);

  // Plotly 配置选项
  const config = useMemo(() => ({
    displayModeBar: true,
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  }), []);

  // 添加数据转换和列名获取的逻辑
  const { processedData, columnNames } = useMemo(() => {
    if (!data || !data.length) return { processedData: [], columnNames: [] };
    
    const names = data[0];  // 第一行是列名
    const processed = data.slice(1);  // 从第二行开始的所有数据
    
    return { processedData: processed, columnNames: names };
  }, [data]);
  
  // 当选择新的列时，自动设置默认的图表类型
  useEffect(() => {
    if (currentColumn) {
      // 如果是类别特征，默认使用饼图
      if (categorical_columns.includes(currentColumn)) {
        setChartType('pie');
      } else {
        setChartType('histogram');  // 数值特征默认使用直方图
      }
    }
  }, [currentColumn, categorical_columns]);

  // 定义转换函数
  const transformData = (values, type) => {
    return values.map(val => {
      const num = Number(val);
      if (isNaN(num)) return null;
      switch (type) {
        case 'x':
          return num;
        case 'x^2':
          return num * num;
        case 'log10(x)':
          return num > 0 ? Math.log10(num) : null;
        case 'log10(x+1)':
          return num > -1 ? Math.log10(num + 1) : null;
        case 'ln(x)':
          return num > 0 ? Math.log(num) : null;
        case 'ln(x+1)':
          return num > -1 ? Math.log(num + 1) : null;
        default:
          return num;
      }
    }).filter(val => val !== null);
  };

  // 更新图表数据的逻辑
  useEffect(() => {
    if (!currentColumn || !chartType || !processedData.length) {
      setPlotData(null);
      return;
    }

    setLoading(true);
    try {
      const columnIndex = columnNames.indexOf(currentColumn);
      const rawValues = processedData.map(row => row[columnIndex]);
      
      let newPlotData;
      if (chartType === 'pie' && categorical_columns.includes(currentColumn)) {
        const valueCount = rawValues.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        
        newPlotData = [{
          type: 'pie',
          labels: Object.keys(valueCount),
          values: Object.values(valueCount),
          name: currentColumn,
          textinfo: "label+percent",
          hoverinfo: "label+value+percent",
          hole: 0.4,  // 设置成环形图
          marker: {
            colors: [
              '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
              '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
            ]
          }
        }];
      } else {
        const values = transformData(rawValues, transformation);
        
        switch (chartType) {
          case 'histogram':
            newPlotData = [{
              type: 'histogram',
              x: values,
              nbinsx: 30,
              name: `${transformation}(${currentColumn})`,
              opacity: 0.7,
              marker: {
                color: '#1f77b4',
                line: {
                  color: 'white',
                  width: 1
                }
              }
            }];
            break;
          case 'box':
            newPlotData = [{
              type: 'box',
              y: values,
              name: currentColumn,
              boxpoints: 'outliers',
              marker: {
                color: '#1f77b4',
                outliercolor: '#e74c3c',
                size: 4
              },
              line: {
                width: 1
              }
            }];
            break;
          case 'violin':
            newPlotData = [{
              type: 'violin',
              y: values,
              name: currentColumn,
              box: { visible: true },
              meanline: { visible: true },
              points: 'outliers',
              line: {
                color: '#1f77b4',
                width: 2
              },
              fillcolor: '#1f77b4',
              opacity: 0.6
            }];
            break;
          case 'density':
            newPlotData = [{
              type: 'violin',
              y: values,
              name: currentColumn,
              box: { visible: false },
              meanline: { visible: false },
              points: false,
              side: 'positive',
              width: 3,
              line: {
                color: '#1f77b4',
                width: 2
              },
              fillcolor: '#1f77b4',
              opacity: 0.6
            }];
            break;
          case 'scatter':
            newPlotData = [{
              type: 'scatter',
              y: values,
              mode: 'markers',
              name: currentColumn,
              marker: {
                size: 6
              }
            }];
            break;
          case 'line':
            newPlotData = [{
              type: 'scatter',
              y: values,
              mode: 'lines',
              name: currentColumn
            }];
            break;
          default:
            newPlotData = null;
        }
      }
      
      setPlotData(newPlotData);
    } catch (error) {
      console.error('图表生成错误:', error);
      message.error('生成图表数据时出错');
      setPlotData(null);
    } finally {
      setLoading(false);
    }
  }, [currentColumn, chartType, processedData, columnNames, transformation, categorical_columns]);
  
  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  // 添加相关系数计算函数
  const calculateCorrelations = useMemo(() => {
    if (!processedData.length || !numeric_columns.length) return null;

    // 创建数值列的数据矩阵
    const numericData = numeric_columns.map(col => {
      const colIndex = columnNames.indexOf(col);
      return processedData.map(row => Number(row[colIndex]));
    });

    // 计算相关系数矩阵
    const correlations = numeric_columns.map((_, i) => {
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

    return correlations;
  }, [processedData, numeric_columns, columnNames]);

  // 修改热力图数据配置
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
        [0, '#2166ac'],      // 深蓝色（强负相关）
        [0.25, '#92c5de'],   // 浅蓝色（弱负相关）
        [0.5, '#f7f7f7'],    // 白色（无相关）
        [0.75, '#fdb863'],   // 橙色（弱正相关）
        [1, '#b2182b']       // 红色（强正相关）
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

  // 修改热力图布局配置
  const heatmapLayout = useMemo(() => ({
    title: {
      text: '特征相关性热力图',
      font: {
        size: 20,
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial'
      },
      y: 0.95
    },
    autosize: true,
    height: 600,
    margin: { l: 120, r: 80, t: 80, b: 120 },
    xaxis: {
      tickangle: 45,
      side: 'bottom',
      tickfont: { size: 11 },
      gridcolor: '#f0f0f0',
      linecolor: '#e0e0e0',
      title: {
        text: '特征',
        font: { size: 14 },
        standoff: 30
      }
    },
    yaxis: {
      autorange: 'reversed',
      tickfont: { size: 11 },
      gridcolor: '#f0f0f0',
      linecolor: '#e0e0e0',
      title: {
        text: '特征',
        font: { size: 14 },
        standoff: 30
      }
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
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div className="feature-section">
              <span className="label">数值特征：</span>
              <Radio.Group 
                value={currentColumn}
                onChange={(e) => setCurrentColumn(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                className="radio-group"
              >
                {numeric_columns.map(col => (
                  <Radio.Button 
                    key={col} 
                    value={col}
                    className="radio-button"
                  >
                    {col}
                    <div 
                      className="radio-button-indicator"
                      style={{
                        transform: currentColumn === col ? 'scaleX(1)' : 'scaleX(0)'
                      }}
                    />
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
            
            <div>
              <span className="label">类别特征：</span>
              <Radio.Group 
                value={currentColumn}
                onChange={(e) => setCurrentColumn(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                className="radio-group"
              >
                {categorical_columns.map(col => (
                  <Radio.Button 
                    key={col} 
                    value={col}
                    className="radio-button"
                  >
                    {col}
                    <div 
                      className="radio-button-indicator"
                      style={{
                        transform: currentColumn === col ? 'scaleX(1)' : 'scaleX(0)'
                      }}
                    />
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </div>
          
          {currentColumn && (
            <>
              {!categorical_columns.includes(currentColumn) && (
                <div>
                  <span className="label">数据转换：</span>
                  <Radio.Group 
                    value={transformation}
                    onChange={(e) => setTransformation(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    className="radio-group"
                  >
                    {['x', 'x^2', 'log10(x)', 'log10(x+1)', 'ln(x)', 'ln(x+1)'].map(trans => (
                      <Radio.Button 
                        key={trans} 
                        value={trans}
                        className="radio-button"
                      >
                        {trans === 'x^2' ? 'x²' : 
                         trans === 'log10(x)' ? 'log₁₀(x)' :
                         trans === 'log10(x+1)' ? 'log₁₀(x+1)' : trans}
                        <div 
                          className="radio-button-indicator"
                          style={{
                            transform: transformation === trans ? 'scaleX(1)' : 'scaleX(0)'
                          }}
                        />
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
              )}

              <div>
                <span className="label">图表类型：</span>
                <Radio.Group 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  className="radio-group"
                >
                  {categorical_columns.includes(currentColumn) ? (
                    <Radio.Button 
                      value="pie"
                      className="radio-button"
                    >
                      饼图
                      <div 
                        className="radio-button-indicator"
                        style={{
                          transform: chartType === 'pie' ? 'scaleX(1)' : 'scaleX(0)'
                        }}
                      />
                    </Radio.Button>
                  ) : (
                    ['histogram', 'box', 'violin', 'density', 'scatter', 'line'].map(type => (
                      <Radio.Button 
                        key={type} 
                        value={type}
                        className="radio-button"
                      >
                        {type === 'histogram' ? '直方图' :
                         type === 'box' ? '箱线图' :
                         type === 'violin' ? '小提琴图' :
                         type === 'density' ? '密度图' :
                         type === 'scatter' ? '散点图' : '折线图'}
                        <div 
                          className="radio-button-indicator"
                          style={{
                            transform: chartType === type ? 'scaleX(1)' : 'scaleX(0)'
                          }}
                        />
                      </Radio.Button>
                    ))
                  )}
                </Radio.Group>
              </div>
            </>
          )}
        </Space>
      </Card>
      
      <div className="visualization-container">
        <Spin spinning={loading}>
          {currentColumn && plotData ? (
            <Plot
              data={plotData}
              layout={layout}
              config={config}
              style={{ width: '100%', height: '100%' }}
              onError={() => message.error('图表绘制时出错')}
            />
          ) : (
            <div className="empty-state">
              <p>请选择要可视化的列</p>
            </div>
          )}
        </Spin>
      </div>
      
      {/* 在现有的可视化容器下方添加热力图 */}
      {numeric_columns.length > 1 && (
        <Card 
          style={{ 
            marginTop: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
          }}
        >
          <Row 
            align="middle" 
            style={{ 
              marginBottom: 16,
              padding: '8px 16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px'
            }}
          >
            <Col span={12}>
              <Space size="large">
                <Space>
                  <span style={{ fontWeight: 500 }}>过滤低相关性：</span>
                  <Switch 
                    checked={showThreshold}
                    onChange={setShowThreshold}
                    style={{ backgroundColor: showThreshold ? '#1890ff' : undefined }}
                  />
                </Space>
                {showThreshold && (
                  <Space>
                    <span style={{ fontWeight: 500 }}>阈值：</span>
                    <InputNumber
                      value={correlationThreshold}
                      onChange={setCorrelationThreshold}
                      min={0}
                      max={1}
                      step={0.1}
                      style={{ 
                        width: 80,
                        borderColor: '#1890ff'
                      }}
                      controls={true}
                    />
                  </Space>
                )}
              </Space>
            </Col>
          </Row>
          <div className="visualization-container">
            <Spin spinning={loading}>
              <Plot
                data={heatmapData}
                layout={heatmapLayout}
                config={{
                  ...config,
                  toImageButtonOptions: {
                    format: 'png',
                    filename: '相关性热力图',
                    height: 1000,
                    width: 1000,
                    scale: 2
                  }
                }}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '600px'
                }}
                onError={() => message.error('热力图绘制时出错')}
              />
            </Spin>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Visualization; 
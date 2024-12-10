import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Radio, Spin, message, Switch, InputNumber, Slider, Row, Col, Button, Typography } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';
import GeminiLogo from './Google_Gemini_logo.svg';
import ReactMarkdown from 'react-markdown';

const { Text, Paragraph } = Typography;

const Visualization = ({ data, numeric_columns, categorical_columns }) => {
  const { t, i18n } = useTranslation();
  const [chartType, setChartType] = useState('');
  const [currentColumn, setCurrentColumn] = useState(numeric_columns[0] || '');
  const [transformation, setTransformation] = useState('x');
  const [loading, setLoading] = useState(false);
  const [plotData, setPlotData] = useState(null);
  const [showThreshold, setShowThreshold] = useState(true);
  const [correlationThreshold, setCorrelationThreshold] = useState(0);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);

  // Add debug logs
  useEffect(() => {
    console.log('Data check:', {
      data: data,
      numeric_columns: numeric_columns,
      categorical_columns: categorical_columns
    });
  }, [data, numeric_columns, categorical_columns]);

  // Add useEffect to handle default selection when numeric columns change
  useEffect(() => {
    if (!currentColumn && numeric_columns.length > 0) {
      setCurrentColumn(numeric_columns[0]);
    }
  }, [numeric_columns, currentColumn]);

  // Custom layout configuration
  const layout = useMemo(() => ({
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: false,
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
      title: 'Frequency',
      gridcolor: '#eee',
      zeroline: false
    },
    font: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      size: 12
    },
    // Pie chart special configuration
    ...(chartType === 'pie' ? {
      height: 500,
      piecolorway: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ]
    } : {})
  }), [currentColumn, chartType]);

  // Plotly configuration options
  const config = useMemo(() => ({
    displayModeBar: true,
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  }), []);

  // Add data transformation and column name extraction logic
  const { processedData, columnNames } = useMemo(() => {
    if (!data || !data.length) return { processedData: [], columnNames: [] };
    
    const names = data[0];  // First row contains column names
    const processed = data.slice(1);  // All data from second row onwards
    
    return { processedData: processed, columnNames: names };
  }, [data]);
  
  // When selecting a new column, automatically set default chart type
  useEffect(() => {
    if (currentColumn) {
      // For categorical features, default to pie chart
      if (categorical_columns.includes(currentColumn)) {
        setChartType('pie');
      } else {
        setChartType('histogram');  // For numeric features, default to histogram
      }
    }
  }, [currentColumn, categorical_columns]);

  // Define transformation functions
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

  // Update chart data logic
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
          hole: 0.4,  // Set to pie chart
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
      console.error('Chart generation error:', error);
      message.error('Error generating chart data');
      setPlotData(null);
    } finally {
      setLoading(false);
    }
  }, [currentColumn, chartType, processedData, columnNames, transformation, categorical_columns]);
  
  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  // Add correlation calculation function
  const calculateCorrelations = useMemo(() => {
    if (!processedData.length || !numeric_columns.length) return null;

    // Create numeric column data matrix
    const numericData = numeric_columns.map(col => {
      const colIndex = columnNames.indexOf(col);
      return processedData.map(row => Number(row[colIndex]));
    });

    // Calculate correlation matrix
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

  // Modify heatmap data configuration
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
        [0, '#2166ac'],      // Dark blue (strong negative correlation)
        [0.25, '#92c5de'],   // Light blue (weak negative correlation)
        [0.5, '#f7f7f7'],    // White (no correlation)
        [0.75, '#fdb863'],   // Orange (weak positive correlation)
        [1, '#b2182b']       // Red (strong positive correlation)
      ],
      zmin: -1,
      zmax: 1,
      hoverongaps: false,
      showscale: true,
      colorbar: {
        title: 'Correlation Coefficient',
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

  // Modify heatmap layout configuration
  const heatmapLayout = useMemo(() => ({
    title: {
      text: 'Feature Correlation Heatmap',
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
        text: '',
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
        text: '',
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

  // Add function to fetch insights
  const fetchInsights = async () => {
    if (!currentColumn || !processedData.length) return;

    setLoadingInsights(true);
    try {
      const columnIndex = columnNames.indexOf(currentColumn);
      const columnData = processedData.map(row => row[columnIndex]);
      
      const response = await fetch('http://localhost:8080/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language
        },
        body: JSON.stringify({
          all_columns: columnNames,
          selected_column: currentColumn,
          column_type: categorical_columns.includes(currentColumn) ? 'categorical' : 'numeric',
          chart_type: chartType,
          transformation: transformation,
          data: columnData,
          language: i18n.language
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setInsights(result.insights);
      setExpandedInsights(true);
    } catch (error) {
      console.error('Error fetching insights:', error);
      message.error(t('visualization.insights.error'));
    } finally {
      setLoadingInsights(false);
    }
  };

  // 添加一个 useEffect 来监听 expandedInsights 的变化
  useEffect(() => {
    // 给 Plotly 一点时间来完成过渡动画
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);  // 300ms 与 CSS transition 时间匹配

    return () => clearTimeout(timer);
  }, [expandedInsights]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div className="feature-section">
              <span className="label">{t('visualization.numericFeatures')}:</span>
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
              <span className="label">{t('visualization.categoricalFeatures')}:</span>
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
                  <span className="label">{t('visualization.dataTransformation')}:</span>
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
                <span className="label">{t('visualization.chartType')}:</span>
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
                      {t('visualization.charts.pieChart')}
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
                        {t(`visualization.charts.${type}Plot`)}
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
      
      <Row gutter={16}>
        <Col 
          span={expandedInsights ? 12 : 20} 
          style={{ transition: 'all 0.3s ease' }}
        >
          <Card>
            <Spin spinning={loading}>
              {currentColumn && plotData ? (
                <Plot
                  data={plotData}
                  layout={{
                    ...layout,
                    autosize: true,
                  }}
                  config={{
                    ...config,
                    responsive: true,
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    minHeight: '500px'
                  }}
                  useResizeHandler={true}
                  onError={() => message.error('Error drawing chart')}
                />
              ) : (
                <div className="empty-state">
                  <p>{t('visualization.selectColumn')}</p>
                </div>
              )}
            </Spin>
          </Card>
        </Col>
        <Col 
          span={expandedInsights ? 12 : 4} 
          style={{ transition: 'all 0.3s ease' }}
        >
          <Card style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ position: 'relative' }}>
                <Button 
                  type="primary" 
                  onClick={fetchInsights}
                  loading={loadingInsights}
                  disabled={!currentColumn}
                  style={{ width: '100%' }}
                >
                  {t('visualization.generateInsights')}
                </Button>
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  bottom: -20, 
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Text type="secondary">
                    {t('visualization.insights.poweredBy')}
                  </Text>
                  <img 
                    src={GeminiLogo} 
                    alt="Gemini" 
                    style={{ 
                      height: '14px',
                      width: 'auto',
                      verticalAlign: 'middle'
                    }} 
                  />
                </div>
              </div>
              <div style={{ 
                marginTop: 24,
                minHeight: 200,
                maxHeight: 400,
                overflowY: 'auto',
                padding: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
                position: 'relative'
              }}>
                <Spin spinning={loadingInsights} tip={t('visualization.insights.loading')}>
                  {insights ? (
                    <ReactMarkdown className="markdown-content">
                      {insights}
                    </ReactMarkdown>
                  ) : (
                    <Text>{t('visualization.noInsightsYet')}</Text>
                  )}
                </Spin>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      
      {/* Add heatmap below existing visualization container */}
      {numeric_columns.length > 1 && (
        <Card 
          style={{ 
            marginTop: 16,
            backgroundColor: '#f7f7f7',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
          }}
        >
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
                <span style={{ fontWeight: 500 }}>{t('visualization.correlation.filterLowCorrelation')}:</span>
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
                  <span style={{ fontWeight: 500, minWidth: '60px' }}>{t('visualization.correlation.threshold')}:</span>
                  <Slider
                    value={correlationThreshold}
                    onChange={setCorrelationThreshold}
                    min={0}
                    max={1}
                    step={0.05}
                    style={{ 
                      width: '200px',
                      margin: '0 10px'
                    }}
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
                  ...config,
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
                  minHeight: '600px'
                }}
                onError={() => message.error('Error drawing heatmap')}
              />
            </Spin>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Visualization; 
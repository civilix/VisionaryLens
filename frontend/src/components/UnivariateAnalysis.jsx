import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Radio, Spin, message, Switch, InputNumber, Slider, Row, Col, Button, Typography } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

const { Text, Paragraph } = Typography;

const UnivariateAnalysis = ({ data, numeric_columns, categorical_columns }) => {
  const { t, i18n } = useTranslation();
  const [chartType, setChartType] = useState('');
  const [currentColumn, setCurrentColumn] = useState(numeric_columns[0] || '');
  const [transformation, setTransformation] = useState('x');
  const [loading, setLoading] = useState(false);
  const [plotData, setPlotData] = useState(null);
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
          selected_column_1: currentColumn,
          column_type_1: categorical_columns.includes(currentColumn) ? 'categorical' : 'numeric',
          data1: columnData,
          chart_type: chartType,
          transformation: transformation,
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

  // Add effect to handle resize when insights expand
  useEffect(() => {
    // Give Plotly some time to complete the transition animation
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);  // 300ms matches CSS transition time

    return () => clearTimeout(timer);
  }, [expandedInsights]);

  // Add a consistent transition duration variable
  const TRANSITION_DURATION = '0.3s';

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
          style={{ 
            transition: `all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        >
          <Card>
            <Spin spinning={loading}>
              {currentColumn && plotData ? (
                <Plot
                  data={plotData}
                  layout={{
                    ...layout,
                    autosize: true,
                    transition: {
                      duration: 300,  // Match with CSS transition (300ms)
                      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                  }}
                  config={{
                    ...config,
                    responsive: true
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    minHeight: '500px',
                    transition: `all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1)`
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
          style={{ 
            transition: `all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1)`
          }}
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
                  {insights ? t('visualization.regenerateInsights') : t('visualization.generateInsights')}
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
                    src="/Google_Gemini_logo.svg" 
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
                minHeight: 400,
                maxHeight: 600,
                overflowY: 'auto',
                padding: 16,
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
                    <div style={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      <Text>{t('visualization.noInsightsYet')}</Text>
                    </div>
                  )}
                </Spin>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UnivariateAnalysis; 
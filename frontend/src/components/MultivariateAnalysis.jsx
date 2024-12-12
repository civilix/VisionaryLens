import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Radio, Spin, message, Select, Row, Col, Button, Typography } from 'antd';
import Plot from 'react-plotly.js';
import './Visualization.css';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;
const { Option } = Select;

// Define transformation options
const transformOptions = [
  { value: 'x', label: 'x' },
  { value: 'x^2', label: 'x²' },
  { value: 'log10(x)', label: 'log₁₀(x)' },
  { value: 'log10(x+1)', label: 'log₁₀(x+1)' },
  { value: 'ln(x)', label: 'ln(x)' },
  { value: 'ln(x+1)', label: 'ln(x+1)' }
];

const MultivariateAnalysis = ({ data, numeric_columns, categorical_columns }) => {
  const { t, i18n } = useTranslation();
  // Set default values: first numeric variable for x, second for y
  const [xColumn, setXColumn] = useState(numeric_columns[0] || '');
  const [yColumn, setYColumn] = useState(numeric_columns[1] || '');
  const [xTransformation, setXTransformation] = useState('x');
  const [yTransformation, setYTransformation] = useState('x');
  const [chartType, setChartType] = useState('scatter');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  
  // Add transition duration constant
  const TRANSITION_DURATION = '0.3s';

  // Update default selections when numeric columns change
  useEffect(() => {
    if (!xColumn && numeric_columns.length > 0) {
      setXColumn(numeric_columns[0]);
    }
    if (!yColumn && numeric_columns.length > 1) {
      setYColumn(numeric_columns[1]);
    }
  }, [numeric_columns]);

  // Reset to first available numeric variable when X axis variable is deselected
  useEffect(() => {
    if (!xColumn && numeric_columns.length > 0) {
      const firstAvailable = numeric_columns.find(col => col !== yColumn);
      if (firstAvailable) {
        setXColumn(firstAvailable);
      }
    }
  }, [xColumn, yColumn, numeric_columns]);

  // Reset to second available numeric variable when Y axis variable is deselected
  useEffect(() => {
    if (!yColumn && numeric_columns.length > 1) {
      const secondAvailable = numeric_columns.find(col => col !== xColumn);
      if (secondAvailable) {
        setYColumn(secondAvailable);
      }
    }
  }, [yColumn, xColumn, numeric_columns]);

  // Get column type
  const getColumnType = (column) => {
    return numeric_columns.includes(column) ? 'numeric' : 'categorical';
  };

  // Determine available chart types based on selected column types
  const availableChartTypes = useMemo(() => {
    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);

    if (!xColumn || !yColumn) return [];

    if (xType === 'numeric' && yType === 'numeric') {
      return [
        { value: 'scatter', label: t('visualization.charts.scatterPlot') },
        { value: '2dhistogram', label: t('visualization.charts.2dHistogram') },
        { value: 'jointplot', label: t('visualization.charts.jointPlot') },
        { value: 'kdejoint', label: t('visualization.charts.kdeJointPlot') }
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
      // Both variables are categorical
      return [
        { value: 'groupedBar', label: t('visualization.charts.groupedBarPlot') },
        { value: 'mosaic', label: t('visualization.charts.mosaicPlot') },
        { value: 'heatmap', label: t('visualization.charts.heatmapPlot') }
      ];
    }
  }, [xColumn, yColumn, t]);

  // Automatically select first available chart type when available types change
  useEffect(() => {
    if (availableChartTypes.length > 0) {
      setChartType(availableChartTypes[0].value);
    }
  }, [availableChartTypes]);

  // Helper function: Calculate 1D KDE
  const calculateKDE1D = (values, points) => {
    const bandwidth = 0.1 * (Math.max(...values) - Math.min(...values));
    return points.map(x => {
      const density = values.reduce((sum, v) => {
        const z = (x - v) / bandwidth;
        return sum + Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI));
      }, 0) / values.length;
      return density;
    });
  };

  // Helper function: Calculate 2D KDE
  const calculateKDE2D = (xValues, yValues) => {
    try {
      // Remove invalid values
      const validPairs = xValues.map((x, i) => [x, yValues[i]])
        .filter(([x, y]) => x !== null && y !== null && !isNaN(x) && !isNaN(y));
      
      const cleanX = validPairs.map(([x]) => x);
      const cleanY = validPairs.map(([_, y]) => y);

      // Calculate data range
      const xMin = Math.min(...cleanX);
      const xMax = Math.max(...cleanX);
      const yMin = Math.min(...cleanY);
      const yMax = Math.max(...cleanY);

      // Create grid
      const gridSize = 50;
      const xGrid = Array.from({length: gridSize}, (_, i) => 
        xMin + (i / (gridSize - 1)) * (xMax - xMin)
      );
      const yGrid = Array.from({length: gridSize}, (_, i) => 
        yMin + (i / (gridSize - 1)) * (yMax - yMin)
      );

      // Calculate bandwidth
      const xBandwidth = 0.1 * (xMax - xMin);
      const yBandwidth = 0.1 * (yMax - yMin);

      // Calculate density
      const density = Array(gridSize).fill().map(() => Array(gridSize).fill(0));

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          let sum = 0;
          for (let k = 0; k < cleanX.length; k++) {
            const xKernel = Math.exp(-0.5 * Math.pow((xGrid[i] - cleanX[k]) / xBandwidth, 2));
            const yKernel = Math.exp(-0.5 * Math.pow((yGrid[j] - cleanY[k]) / yBandwidth, 2));
            sum += xKernel * yKernel;
          }
          density[j][i] = sum / (cleanX.length * xBandwidth * yBandwidth * 2 * Math.PI);
        }
      }

      return {
        xKDE: xGrid,
        yKDE: yGrid,
        zKDE: density
      };
    } catch (error) {
      console.error('KDE calculation error:', error);
      return null;
    }
  };

  // Process data and create chart
  const processData = useMemo(() => {
    if (!data || !xColumn || !yColumn) return null;

    const columnNames = data[0];
    const xIndex = columnNames.indexOf(xColumn);
    const yIndex = columnNames.indexOf(yColumn);
    const processedData = data.slice(1);

    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);

    // Process data based on variable type and transformation method
    const transformValue = (value, transformation, columnType) => {
      if (columnType === 'categorical') return value;
      
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

    const xValues = processedData.map(row => transformValue(row[xIndex], xTransformation, xType));
    const yValues = processedData.map(row => transformValue(row[yIndex], yTransformation, yType));

    if (xType === 'numeric' && yType === 'numeric') {
      switch (chartType) {
        case 'scatter':
          return [{
            type: 'scatter',
            x: xValues,
            y: yValues,
            mode: 'markers',
            marker: { 
              color: '#1890ff',
              size: 6,
              opacity: 0.6
            }
          }];

        case '2dhistogram':
          return [{
            type: 'histogram2d',
            x: xValues,
            y: yValues,
            colorscale: 'YlOrRd',
            nbinsx: 30,
            nbinsy: 30,
            showscale: true,
            colorbar: {
              title: t('visualization.colorbar.frequency'),
              thickness: 20,
              len: 0.9
            }
          }];

        case 'jointplot':
          // Create joint plot (scatter plot + marginal histograms)
          return [
            // Main scatter plot
            {
              type: 'scatter',
              x: xValues,
              y: yValues,
              mode: 'markers',
              marker: { color: '#1890ff', size: 6, opacity: 0.6 },
              xaxis: 'x',
              yaxis: 'y',
              showlegend: false
            },
            // X-axis marginal histogram
            {
              type: 'histogram',
              x: xValues,
              nbinsx: 30,
              marker: { color: '#1890ff', opacity: 0.6 },
              xaxis: 'x',
              yaxis: 'y2',
              showlegend: false
            },
            // Y-axis marginal histogram
            {
              type: 'histogram',
              y: yValues,
              nbinsy: 30,
              marker: { color: '#1890ff', opacity: 0.6 },
              xaxis: 'x2',
              yaxis: 'y',
              showlegend: false
            }
          ];

        case 'kdejoint':
          const kdeResult = calculateKDE2D(xValues, yValues);
          if (!kdeResult) return null;

          const { xKDE, yKDE, zKDE } = kdeResult;
          return [
            // 2D KDE 等高线图
            {
              type: 'contour',
              x: xKDE,
              y: yKDE,
              z: zKDE,
              colorscale: 'YlOrRd',
              showscale: true,
              contours: {
                coloring: 'heatmap',
                showlabels: true
              },
              colorbar: {
                title: t('visualization.colorbar.density'),
                thickness: 20,
                len: 0.9
              },
              line: {
                smoothing: 1.3
              }
            },
            // 散点图叠加
            {
              type: 'scatter',
              x: xValues,
              y: yValues,
              mode: 'markers',
              marker: { 
                color: '#1890ff',
                size: 4,
                opacity: 0.3
              }
            }
          ];

        default:
          return null;
      }
    } 
    else if (xType === 'categorical' && yType === 'numeric') {
      // 分类 vs 数值
      if (chartType === 'bar') {
        // 计算每个类别的平均值
        const categoryStats = {};
        xValues.forEach((x, i) => {
          if (!categoryStats[x]) {
            categoryStats[x] = { sum: 0, count: 0 };
          }
          if (yValues[i] !== null) {
            categoryStats[x].sum += yValues[i];
            categoryStats[x].count += 1;
          }
        });

        const categories = Object.keys(categoryStats);
        const averages = categories.map(cat => 
          categoryStats[cat].count > 0 ? categoryStats[cat].sum / categoryStats[cat].count : 0
        );

        return [{
          type: 'bar',
          x: categories,
          y: averages,
          marker: { color: '#1890ff' }
        }];
      } else {
        // 箱线图或小提琴图
        return [{
          type: chartType,
          x: xValues,
          y: yValues,
          boxpoints: 'outliers',
          jitter: 0.3,
          pointpos: -1.8,
          marker: { color: '#1890ff' }
        }];
      }
    }
    else if (xType === 'numeric' && yType === 'categorical') {
      // 数值 vs 分类
      return [{
        type: chartType,
        x: xValues,
        y: yValues,
        orientation: 'h',  // 水平方向
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.8,
        marker: { color: '#1890ff' }
      }];
    }
    else if (xType === 'categorical' && yType === 'categorical') {
      // 创建交叉表
      const crossTab = {};
      const uniqueX = [...new Set(xValues)];
      const uniqueY = [...new Set(yValues)];
      
      uniqueX.forEach(x => {
        crossTab[x] = {};
        uniqueY.forEach(y => {
          crossTab[x][y] = 0;
        });
      });

      xValues.forEach((x, i) => {
        crossTab[x][yValues[i]]++;
      });

      switch (chartType) {
        case 'groupedBar':
          return uniqueY.map(y => ({
            type: 'bar',
            name: y,
            x: uniqueX,
            y: uniqueX.map(x => crossTab[x][y]),
            marker: { opacity: 0.7 }
          }));

        case 'heatmap':
          const zValues = uniqueX.map(x => 
            uniqueY.map(y => crossTab[x][y])
          );
          return [{
            type: 'heatmap',
            x: uniqueY,
            y: uniqueX,
            z: zValues,
            colorscale: 'YlOrRd',
            showscale: true,
            hoverongaps: false,
            colorbar: {
              title: t('visualization.colorbar.frequency'),
              thickness: 20,
              len: 0.9
            }
          }];

        case 'mosaic':
          // 计算总和和比例
          const total = xValues.length;
          const xProportions = uniqueX.map(x => 
            uniqueY.reduce((sum, y) => sum + crossTab[x][y], 0) / total
          );
          
          return uniqueY.map((y, yi) => {
            let cumsum = 0;
            return {
              type: 'bar',
              name: y,
              x: xProportions,
              y: uniqueX,
              orientation: 'h',
              marker: { 
                opacity: 0.7,
                color: `hsl(${(yi * 360) / uniqueY.length}, 70%, 50%)`
              },
              offset: 0,
              customdata: uniqueX.map(x => ({
                count: crossTab[x][y],
                percent: (crossTab[x][y] / total * 100).toFixed(1)
              })),
              hovertemplate: 
                `%{y}<br>${y}: %{customdata.count}<br>占比: %{customdata.percent}%<extra></extra>`
            };
          });

        default:
          return null;
      }
    }

    return null;
  }, [data, xColumn, yColumn, xTransformation, yTransformation, chartType]);

  // Chart layout configuration
  const layout = useMemo(() => {
    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);
    const isJointPlot = chartType === 'jointplot';
    const isKDEJoint = chartType === 'kdejoint';

    const baseLayout = {
      autosize: true,
      margin: { l: 80, r: 50, t: 50, b: 80 },
      showlegend: false,
      title: {
        text: `${yColumn} vs ${xColumn}`,
        font: { size: 16 }
      },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      height: 600
    };

    if (isJointPlot) {
      return {
        ...baseLayout,
        grid: {
          rows: 2,
          columns: 2,
          pattern: 'independent',
          roworder: 'bottom to top'
        },
        xaxis: {
          domain: [0, 0.85],
          showgrid: true,
          title: xColumn
        },
        yaxis: {
          domain: [0, 0.85],
          showgrid: true,
          title: yColumn
        },
        xaxis2: {
          domain: [0.85, 1],
          showgrid: false,
          showticklabels: false
        },
        yaxis2: {
          domain: [0.85, 1],
          showgrid: false,
          showticklabels: false
        }
      };
    }

    if (chartType === 'kdejoint') {
      return {
        ...baseLayout,
        showlegend: false,
        margin: { l: 60, r: 60, t: 40, b: 60 },
        xaxis: {
          title: xColumn,
          showgrid: true,
          zeroline: false
        },
        yaxis: {
          title: yColumn,
          showgrid: true,
          zeroline: false
        }
      };
    }

    return {
      ...baseLayout,
      xaxis: {
        title: xColumn,
        type: xType === 'numeric' ? 'linear' : 'category',
        gridcolor: '#f0f0f0',
        zerolinecolor: '#e8e8e8'
      },
      yaxis: {
        title: yColumn,
        type: yType === 'numeric' ? 'linear' : 'category',
        gridcolor: '#f0f0f0',
        zerolinecolor: '#e8e8e8'
      }
    };
  }, [xColumn, yColumn, chartType]);

  // Add insights fetch function
  const fetchInsights = async () => {
    if (!xColumn || !yColumn || !data.length) return;

    setLoadingInsights(true);
    try {
      const columnNames = data[0];
      const processedData = data.slice(1);
      
      // Get data for each column
      const xIndex = columnNames.indexOf(xColumn);
      const yIndex = columnNames.indexOf(yColumn);
      const data1 = processedData.map(row => row[xIndex]);
      const data2 = processedData.map(row => row[yIndex]);

      const response = await fetch('http://localhost:8080/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language
        },
        body: JSON.stringify({
          all_columns: columnNames,
          selected_column_1: xColumn,
          column_type_1: categorical_columns.includes(xColumn) ? 'categorical' : 'numeric',
          data1: data1,
          optional_selected_column_2: yColumn,
          optional_column_type_2: categorical_columns.includes(yColumn) ? 'categorical' : 'numeric',
          data2: data2,
          chart_type: chartType,
          transformation: `${xTransformation}, ${yTransformation}`,
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

  // Add resize effect for insights expansion
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    return () => clearTimeout(timer);
  }, [expandedInsights]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16}>
            {/* X轴变量选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">{t('visualization.axisLabel.xAxis')}:</span>
                <div className="feature-content">
                  <Select
                    value={xColumn}
                    onChange={(value) => {
                      if (value === yColumn) {
                        message.warning(t('visualization.warnings.sameVariable'));
                        return;
                      }
                      setXColumn(value);
                    }}
                    style={{ width: '100%' }}
                    placeholder={t('visualization.placeholders.selectXAxis')}
                  >
                    <Select.OptGroup label={t('visualization.featureGroups.numeric')}>
                      {numeric_columns.map(col => (
                        <Option 
                          key={col} 
                          value={col}
                          disabled={col === yColumn}
                        >
                          {col}
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label={t('visualization.featureGroups.categorical')}>
                      {categorical_columns.map(col => (
                        <Option 
                          key={col} 
                          value={col}
                          disabled={col === yColumn}
                        >
                          {col}
                        </Option>
                      ))}
                    </Select.OptGroup>
                  </Select>
                </div>
              </div>
            </Col>
            
            {/* X轴变换选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">{t('visualization.axisLabel.xTransform')}:</span>
                <div className="feature-content">
                  <Select
                    value={xTransformation}
                    onChange={setXTransformation}
                    style={{ width: '100%' }}
                    placeholder={t('visualization.placeholders.selectXTransform')}
                    disabled={getColumnType(xColumn) === 'categorical'}
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
                <span className="feature-label">{t('visualization.axisLabel.yAxis')}:</span>
                <div className="feature-content">
                  <Select
                    value={yColumn}
                    onChange={(value) => {
                      if (value === xColumn) {
                        message.warning(t('visualization.warnings.sameVariable'));
                        return;
                      }
                      setYColumn(value);
                    }}
                    style={{ width: '100%' }}
                    placeholder={t('visualization.placeholders.selectYAxis')}
                  >
                    <Select.OptGroup label={t('visualization.featureGroups.numeric')}>
                      {numeric_columns.map(col => (
                        <Option 
                          key={col} 
                          value={col}
                          disabled={col === xColumn}
                        >
                          {col}
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label={t('visualization.featureGroups.categorical')}>
                      {categorical_columns.map(col => (
                        <Option 
                          key={col} 
                          value={col}
                          disabled={col === xColumn}
                        >
                          {col}
                        </Option>
                      ))}
                    </Select.OptGroup>
                  </Select>
                </div>
              </div>
            </Col>

            {/* Y轴变换选择 */}
            <Col span={6}>
              <div className="feature-row">
                <span className="feature-label">{t('visualization.axisLabel.yTransform')}:</span>
                <div className="feature-content">
                  <Select
                    value={yTransformation}
                    onChange={setYTransformation}
                    style={{ width: '100%' }}
                    placeholder={t('visualization.placeholders.selectYTransform')}
                    disabled={getColumnType(yColumn) === 'categorical'}
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

      <Row gutter={16}>
        <Col 
          span={expandedInsights ? 12 : 20} 
          style={{ 
            transition: `all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        >
          <Card>
            <div style={{ height: '600px' }}>
              <Spin spinning={loading}>
                {processData ? (
                  <Plot
                    data={processData}
                    layout={{
                      ...layout,
                      autosize: true,
                      transition: {
                        duration: 300,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      }
                    }}
                    config={{
                      displayModeBar: true,
                      responsive: true,
                      displaylogo: false
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      transition: `all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1)`
                    }}
                    useResizeHandler={true}
                  />
                ) : (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Text type="secondary">{t('visualization.noData')}</Text>
                  </div>
                )}
              </Spin>
            </div>
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
                  disabled={!xColumn || !yColumn}
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

export default MultivariateAnalysis; 
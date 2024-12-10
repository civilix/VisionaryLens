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
  // 设置默认值：第一个数值变量为x，第二个数值变量为y
  const [xColumn, setXColumn] = useState(numeric_columns[0] || '');
  const [yColumn, setYColumn] = useState(numeric_columns[1] || '');
  const [xTransformation, setXTransformation] = useState('x');
  const [yTransformation, setYTransformation] = useState('x');
  const [chartType, setChartType] = useState('scatter');
  const [loading, setLoading] = useState(false);

  // 当数值列发生变化时，更新默认选择
  useEffect(() => {
    if (!xColumn && numeric_columns.length > 0) {
      setXColumn(numeric_columns[0]);
    }
    if (!yColumn && numeric_columns.length > 1) {
      setYColumn(numeric_columns[1]);
    }
  }, [numeric_columns]);

  // 当 X 轴变量被取消选择时，重置为第一个可用的数值变量
  useEffect(() => {
    if (!xColumn && numeric_columns.length > 0) {
      const firstAvailable = numeric_columns.find(col => col !== yColumn);
      if (firstAvailable) {
        setXColumn(firstAvailable);
      }
    }
  }, [xColumn, yColumn, numeric_columns]);

  // 当 Y 轴变量被取消选择时，重置为第二个可用的数值变量
  useEffect(() => {
    if (!yColumn && numeric_columns.length > 1) {
      const secondAvailable = numeric_columns.find(col => col !== xColumn);
      if (secondAvailable) {
        setYColumn(secondAvailable);
      }
    }
  }, [yColumn, xColumn, numeric_columns]);

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
      // 两个都是分类变量
      return [
        { value: 'groupedBar', label: t('visualization.charts.groupedBarPlot') },
        { value: 'stackedBar', label: t('visualization.charts.stackedBarPlot') },
        { value: 'mosaic', label: t('visualization.charts.mosaicPlot') },
        { value: 'heatmap', label: t('visualization.charts.heatmapPlot') }
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

    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);

    // 根据变量类型和转换方式处理数据
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
      if (chartType === 'line') {
        // 为折线图特殊处理：排序并计算平均值
        const xyPairs = xValues.map((x, i) => ({
          x: x,
          y: yValues[i]
        })).filter(pair => pair.x !== null && pair.y !== null);

        // 按 X 值排序
        xyPairs.sort((a, b) => a.x - b.x);

        // 处理重复的 X 值（取平均值）
        const aggregatedData = {};
        xyPairs.forEach(pair => {
          if (!aggregatedData[pair.x]) {
            aggregatedData[pair.x] = {
              sum: pair.y,
              count: 1
            };
          } else {
            aggregatedData[pair.x].sum += pair.y;
            aggregatedData[pair.x].count += 1;
          }
        });

        const uniqueX = Object.keys(aggregatedData).map(Number);
        const averagedY = uniqueX.map(x => aggregatedData[x].sum / aggregatedData[x].count);

        return [{
          type: 'scatter',  // 使用 scatter 类型但以线条模式显示
          x: uniqueX,
          y: averagedY,
          mode: 'lines+markers',
          line: {
            shape: 'linear',
            width: 2,
            color: '#1890ff'
          },
          marker: {
            size: 6,
            color: '#1890ff'
          }
        }];
      } else {
        // 散点图保持不变
        return [{
          type: 'scatter',
          x: xValues,
          y: yValues,
          mode: 'markers',
          marker: { 
            color: '#1890ff',
            size: 6
          }
        }];
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

        case 'stackedBar':
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
              title: '频数',
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

  // 图表布局配置
  const layout = useMemo(() => {
    const xType = getColumnType(xColumn);
    const yType = getColumnType(yColumn);
    const isCategoricalChart = xType === 'categorical' && yType === 'categorical';

    return {
      autosize: true,
      margin: { l: 80, r: 50, t: 50, b: 80 },
      showlegend: isCategoricalChart && chartType !== 'heatmap',
      barmode: chartType === 'groupedBar' ? 'group' : 
               chartType === 'stackedBar' ? 'stack' : undefined,
      barnorm: chartType === 'mosaic' ? 'percent' : undefined,
      title: {
        text: `${yColumn} vs ${xColumn}`,
        font: { size: 16 }
      },
      xaxis: {
        title: xColumn,
        type: xType === 'numeric' ? 'linear' : 'category',
        tickangle: xType === 'categorical' ? 45 : 0,
        gridcolor: '#f0f0f0',
        zerolinecolor: '#e8e8e8'
      },
      yaxis: {
        title: yColumn,
        type: yType === 'numeric' ? 'linear' : 'category',
        gridcolor: '#f0f0f0',
        zerolinecolor: '#e8e8e8'
      },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      height: 600
    };
  }, [xColumn, yColumn, chartType]);

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
                    onChange={(value) => {
                      if (value === yColumn) {
                        message.warning('X轴和Y轴不能选择相同的变量');
                        return;
                      }
                      setXColumn(value);
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择X轴变量"
                  >
                    <Select.OptGroup label="数值特征">
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
                    <Select.OptGroup label="类别特征">
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
                <span className="feature-label">X轴变换:</span>
                <div className="feature-content">
                  <Select
                    value={xTransformation}
                    onChange={setXTransformation}
                    style={{ width: '100%' }}
                    placeholder="选择X轴变换"
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
                <span className="feature-label">Y轴变量:</span>
                <div className="feature-content">
                  <Select
                    value={yColumn}
                    onChange={(value) => {
                      if (value === xColumn) {
                        message.warning('X轴和Y轴不能选择相同的变量');
                        return;
                      }
                      setYColumn(value);
                    }}
                    style={{ width: '100%' }}
                    placeholder="选择Y轴变量"
                  >
                    <Select.OptGroup label="数值特征">
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
                    <Select.OptGroup label="类别特征">
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
                <span className="feature-label">Y轴变换:</span>
                <div className="feature-content">
                  <Select
                    value={yTransformation}
                    onChange={setYTransformation}
                    style={{ width: '100%' }}
                    placeholder="选择Y轴变换"
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
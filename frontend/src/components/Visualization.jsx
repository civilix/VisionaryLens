import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Select, Radio, Spin, message } from 'antd';
import Plot from 'react-plotly.js';

const Visualization = ({ data, numeric_columns, categorical_columns }) => {
  const [chartType, setChartType] = useState('');
  const [currentColumn, setCurrentColumn] = useState('');
  const [transformation, setTransformation] = useState('x');
  const [loading, setLoading] = useState(false);
  const [plotData, setPlotData] = useState(null);

  // 添加调试日志
  useEffect(() => {
    console.log('数据检查:', {
      data: data,
      numeric_columns: numeric_columns,
      categorical_columns: categorical_columns
    });
  }, [data, numeric_columns, categorical_columns]);

  const layout = useMemo(() => ({
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: true,
    title: {
      text: currentColumn ? `${currentColumn} 的分布` : '',
      font: { size: 16 }
    },
    xaxis: {
      title: currentColumn
    },
    yaxis: {
      title: '频次'
    }
  }), [currentColumn]);

  const config = useMemo(() => ({
    displayModeBar: true,
    responsive: true
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
        // 对类别数据进行统计
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
          hoverinfo: "label+value+percent"
        }];
      } else {
        // 数值型数据的处理
        const values = transformData(rawValues, transformation);
        
        switch (chartType) {
          case 'histogram':
            newPlotData = [{
              type: 'histogram',
              x: values,
              nbinsx: 30,
              name: `${transformation}(${currentColumn})`
            }];
            break;
          case 'box':
            newPlotData = [{
              type: 'box',
              y: values,
              name: currentColumn,
              boxpoints: 'outliers'
            }];
            break;
          case 'violin':
            newPlotData = [{
              type: 'violin',
              y: values,
              name: currentColumn,
              box: { visible: true },
              meanline: { visible: true },
              points: 'outliers'
            }];
            break;
          case 'density':
            // 使用KDE（核密度估计）
            newPlotData = [{
              type: 'violin',
              y: values,
              name: currentColumn,
              box: { visible: false },
              meanline: { visible: false },
              points: false,
              side: 'positive',
              width: 3
            }];
            break;
          case 'scatter':
            // 散点图，使用索引作为x轴
            newPlotData = [{
              type: 'scatter',
              y: values,
              mode: 'markers',
              name: currentColumn,
              marker: { size: 6 }
            }];
            break;
          case 'line':
            // 折线图，使用索引作为x轴
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


  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ marginRight: '8px' }}>数值特征：</span>
              <Radio.Group 
                value={currentColumn}
                onChange={(e) => setCurrentColumn(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                {numeric_columns.map(col => (
                  <Radio.Button key={col} value={col}>{col}</Radio.Button>
                ))}
              </Radio.Group>
            </div>
            
            <div>
              <span style={{ marginRight: '8px' }}>类别特征：</span>
              <Radio.Group 
                value={currentColumn}
                onChange={(e) => setCurrentColumn(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                {categorical_columns.map(col => (
                  <Radio.Button key={col} value={col}>{col}</Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </div>
          
          {currentColumn && (
            <>
              {!categorical_columns.includes(currentColumn) && (
                <div>
                  <span style={{ marginRight: '8px' }}>数据转换：</span>
                  <Radio.Group 
                    value={transformation}
                    onChange={(e) => setTransformation(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="x">x</Radio.Button>
                    <Radio.Button value="x^2">x²</Radio.Button>
                    <Radio.Button value="log10(x)">log₁₀(x)</Radio.Button>
                    <Radio.Button value="log10(x+1)">log₁₀(x+1)</Radio.Button>
                    <Radio.Button value="ln(x)">ln(x)</Radio.Button>
                    <Radio.Button value="ln(x+1)">ln(x+1)</Radio.Button>
                  </Radio.Group>
                </div>
              )}

              <div>
                <span style={{ marginRight: '8px' }}>图表类型：</span>
                <Radio.Group 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  {categorical_columns.includes(currentColumn) ? (
                    // 类别特征的图表选项
                    <Radio.Button value="pie">饼图</Radio.Button>
                  ) : (
                    // 数值特征的图表选项
                    <>
                      <Radio.Button value="histogram">直方图</Radio.Button>
                      <Radio.Button value="box">箱线图</Radio.Button>
                      <Radio.Button value="violin">小提琴图</Radio.Button>
                      <Radio.Button value="density">密度图</Radio.Button>
                      <Radio.Button value="scatter">散点图</Radio.Button>
                      <Radio.Button value="line">折线图</Radio.Button>
                    </>
                  )}
                </Radio.Group>
              </div>
            </>
          )}
        </Space>
      </Card>
      
      <div style={{ 
        minHeight: 500,
        border: '1px solid #f0f0f0',
        borderRadius: '2px',
        padding: '8px',
        position: 'relative'
      }}>
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <p>请选择要可视化的列</p>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Visualization; 
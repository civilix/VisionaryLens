import React, { useState, useEffect, useMemo } from 'react';
import { Card, Space, Select, Radio, Spin, message } from 'antd';
import Plot from 'react-plotly.js';

const Visualization = ({ data }) => {
  const [chartType, setChartType] = useState('');
  const [currentColumn, setCurrentColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [plotData, setPlotData] = useState(null);

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

  // 当选择新的列时，自动设置默认的图表类型
  useEffect(() => {
    if (currentColumn) {
      const isNumeric = typeof data[0][currentColumn] === 'number';
      setChartType(isNumeric ? 'histogram' : 'bar');
    }
  }, [currentColumn, data]);

  // 更新图表数据的逻辑
  useEffect(() => {
    if (!currentColumn || !chartType) {
      setPlotData(null);
      return;
    }

    setLoading(true);
    try {
      const values = data.map(d => d[currentColumn]);
      let newPlotData;

      switch (chartType) {
        case 'histogram':
          newPlotData = [{
            type: 'histogram',
            x: values,
            nbinsx: 30,
            name: currentColumn
          }];
          break;
        case 'bar':
          const counts = {};
          values.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
          });
          newPlotData = [{
            type: 'bar',
            x: Object.keys(counts),
            y: Object.values(counts),
            name: currentColumn,
            text: Object.values(counts),
            textposition: 'auto',
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
        case 'pie':
          const pieData = {};
          values.forEach(val => {
            pieData[val] = (pieData[val] || 0) + 1;
          });
          newPlotData = [{
            type: 'pie',
            labels: Object.keys(pieData),
            values: Object.values(pieData),
            name: currentColumn,
            textinfo: 'label+percent',
            hoverinfo: 'label+value+percent'
          }];
          break;
        default:
          newPlotData = null;
      }
      setPlotData(newPlotData);
    } catch (error) {
      console.error('图表生成错误:', error);
      message.error('生成图表数据时出错');
      setPlotData(null);
    } finally {
      setLoading(false);
    }
  }, [currentColumn, chartType, data]);
  useEffect(() => {
    console.log('数据表头:', data[0]);
  }, [data]);


  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Select
            style={{ width: 200 }}
            placeholder="选择要可视化的列"
            value={currentColumn}
            onChange={setCurrentColumn}
            options={Object.values(data[0] || {}).map(col => ({
              label: col,
              value: col,
              key: col
            }))}
          />
          
          {currentColumn && (
            <div>
              <span style={{ marginRight: '8px' }}>图表类型：</span>
              <Radio.Group 
                value={chartType} 
                onChange={(e) => setChartType(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="histogram">直方图</Radio.Button>
                <Radio.Button value="bar">柱状图</Radio.Button>
                <Radio.Button value="box">箱线图</Radio.Button>
                <Radio.Button value="violin">小提琴图</Radio.Button>
                <Radio.Button value="pie">饼图</Radio.Button>
              </Radio.Group>
            </div>
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
def generate_insights(all_columns, selected_column, column_type, chart_type, transformation, data):
    """
    生成数据洞察的基础函数
    
    Args:
        all_columns (list): 所有列的名称
        selected_column (str): 当前选中的列名
        column_type (str): 列的类型 ('numeric' 或 'categorical')
        chart_type (str): 当前选择的图表类型
        transformation (str): 数据转换方式 (如 'x', 'log10(x)' 等)
        data (list): 选中列的数据
        
    Returns:
        str: 数据分析的洞察文本
    """
    
    # 输出接收到的数据（用于调试）
    insights = f"""
接收到的数据概况：
- 选中的列: {selected_column}
- 数据类型: {column_type}
- 图表类型: {chart_type}
- 数据转换: {transformation}
- 数据长度: {len(data)}
- 数据前5个值: {data[:5]}
"""
    
    return insights 
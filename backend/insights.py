def generate_insights(all_columns, selected_column, column_type, chart_type, transformation, data, language):

    # 输出接收到的数据（用于调试）
    insights = f"""
接收到的数据概况：
- 选中的列: {selected_column}
- 数据类型: {column_type}
- 图表类型: {chart_type}
- 数据转换: {transformation}
- 数据长度: {len(data)}
- 数据前5个值: {data[:5]}
- 语言: {language}
"""
    
    return insights 
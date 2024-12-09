def generate_insights(all_columns, selected_column, column_type, chart_type, transformation, data, language):
    """
    Basic function to generate data insights
    
    Args:
        all_columns (list): Names of all columns
        selected_column (str): Currently selected column name
        column_type (str): Column type ('numeric' or 'categorical')
        chart_type (str): Currently selected chart type
        transformation (str): Data transformation method (e.g., 'x', 'log10(x)', etc.)
        data (list): Data of the selected column
        language (str): Language code ('zh', 'en', or 'ja')
        
    Returns:
        str: Insights text for data analysis
    """
    
    insights_zh = f"""
数据概况：
- 选中的列: {selected_column}
- 数据类型: {column_type}
- 图表类型: {chart_type}
- 数据转换: {transformation}
- 数据长度: {len(data)}
- 数据前5个值: {data[:5]}
- 语言: {language}
"""

    insights_en = f"""
Data Overview:
- Selected Column: {selected_column}
- Data Type: {column_type}
- Chart Type: {chart_type}
- Transformation: {transformation}
- Data Length: {len(data)}
- First 5 Values: {data[:5]}
- Language: {language}
"""

    insights_ja = f"""
データ概要：
- 選択された列: {selected_column}
- データ型: {column_type}
- グラフタイプ: {chart_type}
- 変換方式: {transformation}
- データ長: {len(data)}
- 最初の5つの値: {data[:5]}
- 言語: {language}
"""
    
    # Return insights based on language
    if language == 'en':
        return insights_en
    elif language == 'ja':
        return insights_ja
    else:  # Default to Chinese
        return insights_zh
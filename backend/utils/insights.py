import os
import google.generativeai as genai
def generate_insights(all_columns, selected_column, column_type, chart_type, transformation, data, language):

    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    
    context_dict = {
        "dataset_columns": all_columns,
        "selected_column": selected_column,
        "column_type": column_type,
        "chart_type": chart_type,
        "transformation": transformation,
        "data_sample": data[:5], 
        "data_length": len(data)
    }
    # Create the model
    generation_config = {
                        "temperature": 1,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 8192,
                        "response_mime_type": "text/plain",
                        }

    model = genai.GenerativeModel(
                                    model_name="gemini-1.5-flash",
                                    generation_config=generation_config,
                                )
    chat_session = model.start_chat(
                                    history=[
                                        {
                                        "role": "user",
                                        "parts": [
                                            "You are a data analysis assistant. A user has provided the following context about their dataset and their visualization request. Your task is to analyze the context and provide insights as if you have seen the generated chart. Use the details about the selected column, chart type, and transformations applied to infer patterns, trends, or relationships. Then, offer actionable suggestions or observations based on your analysis. Ensure your response is in the specified language. \n\n### Context:\n- Dataset Columns: {all_columns}\n- Selected Column: {selected_column} (Type: {column_type})\n- Chart Type: {chart_type}\n- Transformation Applied: {transformation}\n- Data Sample: {data}\n\n### Requirements:\n1. Assume the chart has been generated using the selected column with the specified chart type and transformation.\n2. Identify key patterns, trends, or anomalies in the data, and relate these to the type of visualization.\n3. Provide actionable insights or suggestions for further analysis or decision-making.\n4. Respond in {language}.\n\n### Example Output Format:\n- **Observed Insights:** Describe patterns, trends, or notable features based on the chart type and transformed data.\n- **Actionable Suggestions:** Provide specific advice for further exploration or business decisions.\n- **Additional Notes:** Highlight any caveats, limitations, or alternative perspectives based on the context provided.\n",
                                        ],
                                        },
                                        {
                                        "role": "model",
                                        "parts": [
                                            "Please provide the values for `{all_columns}`, `{selected_column}`, `{column_type}`, `{chart_type}`, `{transformation}`, and `{data}` so I can generate the analysis.  I need this information to fulfill your request.\n",
                                        ],
                                        },
                                    ]
                                    )
    #send all information to the model
    response = chat_session.send_message()

    print(response.text)
    
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
import os
import google.generativeai as genai
def generate_insights(all_columns, selected_column_1, column_type_1, data1, 
                     optional_selected_column_2=None, optional_column_type_2=None, 
                     data2=None, chart_type=None, transformation=None, language='en'):
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
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
        history = [
            {
                "role": "user",
                "parts": [
                    "You are a data analysis assistant. A user has provided the following context about their dataset and their visualization request. Your task is to analyze the context and provide insights as if you have seen the generated chart. Depending on whether one or two columns are selected, perform either univariate or bivariate analysis, respectively. Use the details about the selected columns, chart type, and transformations applied to infer patterns, trends, or relationships. Then, offer actionable suggestions or observations based on your analysis. Ensure your response is in {language}.\n\n### Context:\n- Dataset Columns: {all_columns}\n- Selected Column(s):\n  - Column 1: {selected_column_1} (Type: {column_type_1}, Data: {data1})\n  - {optional_selected_column_2} (Type: {optional_column_type_2}, Data: {data2})\n- Chart Type: {chart_type}\n- Transformation Applied: {transformation}\n\n### Requirements:\n1. **Univariate Analysis (if only one column is selected):**\n   - Assume the chart has been generated using the first column ({selected_column_1}) with the specified chart type and transformation.\n   - Identify key patterns, trends, or anomalies in {data1}.\n   - Relate observations to the visualization type.\n\n2. **Bivariate Analysis (if two columns are selected):**\n   - Assume the chart visualizes the relationship, comparison, or distribution involving {data1} and {data2} based on the specified chart type and transformation.\n   - Analyze the interaction or relationship between {selected_column_1} and {optional_selected_column_2}, such as correlation, clustering, or differences.\n\n3. Provide actionable insights or suggestions for further analysis or decision-making.\n\n4. Respond in {language}.\n\n### Example Output Format:\n(No title here))\n- **Observed Insights:** Describe patterns, trends, or notable features based on the chart type, selected column(s), and transformed data.\n- **Actionable Suggestions:** Provide specific advice for further exploration or business decisions.\n- **Additional Notes:** Highlight any caveats, limitations, or alternative perspectives based on the context provided.\n"
                ]
            },
            {
                "role": "model", 
                "parts": [
                    "Please provide the values for `{all_columns}`, `{selected_column_1}`, `{column_type_1}`, `{data1}`, `{optional_selected_column_2}`, `{optional_column_type_2}`, `{data2}`, `{chart_type}`, `{transformation}`, and `{language}` so I can generate the analysis. I need this information to fulfill your request.\n"
                ]
            }
        ]
    )

    context = f"""
    all_columns={all_columns}
    selected_column_1={selected_column_1}
    column_type_1={column_type_1}
    data1={data1}
    optional_selected_column_2={optional_selected_column_2}
    optional_column_type_2={optional_column_type_2}
    data2={data2}
    chart_type={chart_type}
    transformation={transformation}
    language={language}
    """
    total_tokens = model.count_tokens(context)
    print(f'Total tokens: {total_tokens}')
    response = chat_session.send_message([context])
    
    return response.text
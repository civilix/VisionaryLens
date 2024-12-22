import os
import sys

# 添加当前目录到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
from utils.insights import generate_insights

app = Flask(__name__)
CORS(app)

@app.route('/api/example-data', methods=['GET'])
def get_example_data():
    try:
        df = pd.read_excel('example_data/ad-data.xlsx')
        # Modify numeric type conversion logic
        for column in df.columns:
            try:
                df[column] = pd.to_numeric(df[column])
            except (ValueError, TypeError):
                continue
        
        # Numeric feature list
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        # Categorical (non-numeric) feature list
        categorical_columns = df.select_dtypes(exclude=[np.number]).columns.tolist()
        
        # Add debug output
        print("Numeric columns:", numeric_columns)
        print("Categorical columns:", categorical_columns)
        
        preview_data = df.head().replace({np.nan: None}).to_dict('records')
        
        return jsonify({
            "data": preview_data,
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns
        })
        
    except Exception as e:
        print(f"读取文件错误: {str(e)}")
        return jsonify({
            "message": "数据读取失败",
            "error": str(e)
        }), 500

@app.route('/api/samples/<filename>')
def send_sample_file(filename):
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'example_data', filename)
        
        if filename.endswith('.csv'):
            df = pd.read_csv(file_path, sep=';')
        else:  # Excel files
            df = pd.read_excel(file_path)
        
        # Modify numeric type conversion logic
        for column in df.columns:
            try:
                df[column] = pd.to_numeric(df[column])
            except (ValueError, TypeError):
                continue
        
        # Check missing values and outliers in numeric columns
        numeric_stats = {}
        for column in df.select_dtypes(include=[np.number]).columns:
            stats = {
                'missing_count': int(df[column].isna().sum()),
                'missing_percentage': float(df[column].isna().mean() * 100),
                'inf_count': int(np.isinf(df[column]).sum()),
                'outliers_count': int(len(df[(np.abs(df[column] - df[column].mean()) > (3 * df[column].std()))]))
            }
            numeric_stats[column] = stats

        # Data type classification
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(exclude=[np.number]).columns.tolist()

        # Handle special values
        df = df.replace({
            np.nan: None,
            np.inf: None,
            -np.inf: None
        })
        
        headers = df.columns.tolist()
        data = df.values  # Use NumPy array directly
        
        return jsonify({
            'headers': headers,
            'data': data.tolist(),
            'numeric_analysis': numeric_stats,
            'numeric_columns': numeric_columns,
            'categorical_columns': categorical_columns
        })
        
    except Exception as e:
        print(f"Error reading file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/insights', methods=['POST'])
def get_insights():
    data = request.json
    
    # 统一使用相同的参数格式调用 generate_insights
    return jsonify({
        'insights': generate_insights(
            all_columns=data['all_columns'],
            selected_column_1=data.get('selected_column_1') or data.get('selected_column'),
            column_type_1=data.get('column_type_1') or data.get('column_type'),
            data1=data.get('data1') or data.get('data'),
            optional_selected_column_2=data.get('optional_selected_column_2'),
            optional_column_type_2=data.get('optional_column_type_2'),
            data2=data.get('data2'),
            chart_type=data['chart_type'],
            transformation=data['transformation'],
            language=data.get('language', 'en')
        )
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, sep=';')
        else:  # Excel files
            df = pd.read_excel(file)

        # Convert columns to numeric where possible
        for column in df.columns:
            try:
                df[column] = pd.to_numeric(df[column])
            except (ValueError, TypeError):
                continue

        # Classify data types
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(exclude=[np.number]).columns.tolist()

        # Handle special values
        df = df.replace({
            np.nan: None,
            np.inf: None,
            -np.inf: None
        })

        headers = df.columns.tolist()
        data = df.values.tolist()

        return jsonify({
            'headers': headers,
            'data': data,
            'numeric_columns': numeric_columns,
            'categorical_columns': categorical_columns
        })

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)

# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5000))
#     app.run(host="0.0.0.0", port=port)

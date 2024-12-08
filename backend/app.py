from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
import numpy as np

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

if __name__ == '__main__':
    app.run(debug=True, port=8080)
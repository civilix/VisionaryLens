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
        # 只取前5行数据
        preview_data = df.head().to_dict('records')
        return jsonify(preview_data)
        
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
        
        # 根据文件类型选择不同的读取方法
        if filename.endswith('.csv'):
            df = pd.read_csv(file_path, sep=';')
        else:  # Excel files
            df = pd.read_excel(file_path)
        
        # 检查数值列的缺失值和异常值
        numeric_stats = {}
        for column in df.select_dtypes(include=[np.number]).columns:
            stats = {
                'missing_count': int(df[column].isna().sum()),
                'missing_percentage': float(df[column].isna().mean() * 100),
                'inf_count': int(np.isinf(df[column]).sum()),
                'outliers_count': int(len(df[(np.abs(df[column] - df[column].mean()) > (3 * df[column].std()))])),
            }
            numeric_stats[column] = stats
        
        # 处理特殊值
        df = df.replace({
            np.nan: None,
            np.inf: None,
            -np.inf: None
        })
        
        # 转换为前端需要的格式
        headers = df.columns.tolist()
        data = df.values.tolist()
        
        return jsonify({
            'headers': headers,
            'data': data,
            'numeric_analysis': numeric_stats
        })
        
    except Exception as e:
        print(f"Error reading file: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080) 
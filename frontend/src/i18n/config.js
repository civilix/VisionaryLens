import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: {
          visualization: '可视化',
          regression: '回归分析',
          classification: '分类分析',
          dataPreview: '数据预览',
          appName: 'VisionaryLens',
          fileUpload: {
            dragText: '点击或拖拽文件到此区域',
            supportText: '支持 Excel 文件 (.xlsx, .xls) 或 CSV 文件上传',
            currentFile: '当前文件：',
            reupload: '重新上传',
            sampleFiles: '或者载入示例文件：',
            uploadSuccess: '文件上传成功',
            uploadError: '文件解析失败',
            readError: '文件读取失败',
            noData: '文件中没有有效数据',
            loadSampleError: '加载示例文件失败',
            loadSampleSuccess: '示例文件加载成功',
            sampleFilePrefix: '示例文件: '
          },
          visualization: {
            numericFeatures: '数值型特征',
            categoricalFeatures: '类别型特征',
            dataTransformation: '数据转换',
            chartType: '图表类型',
            charts: {
              pieChart: '饼图',
              histogram: '直方图',
              boxPlot: '箱线图',
              violinPlot: '小提琴图',
              densityPlot: '密度图',
              scatterPlot: '散点图',
              linePlot: '折线图'
            },
            correlation: {
              title: '特征相关性热力图',
              filterLowCorrelation: '过滤低相关性',
              threshold: '阈值',
              coefficient: '相关系数'
            },
            selectColumn: '请选择要可视化的列',
            errorDrawing: '绘制图表出错'
          }
        }
      },
      ja: {
        translation: {
          visualization: '可視化',
          regression: '回帰分析',
          classification: '分類分析',
          dataPreview: 'データプレビュー',
          appName: 'VisionaryLens',
          fileUpload: {
            dragText: 'クリックまたはファイルをドラッグ＆ドロップ',
            supportText: 'Excel (.xlsx, .xls) または CSV ファイルをサポート',
            currentFile: '現在のファイル：',
            reupload: '再アップロード',
            sampleFiles: 'またはサンプルファイルを読み込みます：',
            uploadSuccess: 'ファイルのアップロードに成功しました',
            uploadError: 'ファイルの解析に失敗しました',
            readError: 'ファイルの読み込みに失敗しました',
            noData: 'ファイルに有効なデータがありません',
            loadSampleError: 'サンプルファイルの読み込みに失敗しました',
            loadSampleSuccess: 'サンプルファイルの読み込みに成功しました',
            sampleFilePrefix: 'サンプルファイル: '
          },
          visualization: {
            numericFeatures: '数値データ',
            categoricalFeatures: 'カテゴリーデータ',
            dataTransformation: 'データ変換',
            chartType: 'グラフタイプ',
            charts: {
              pieChart: '円グラフ',
              histogram: 'ヒストグラム',
              boxPlot: '箱ひげ図',
              violinPlot: 'バイオリンプロット',
              densityPlot: '密度プロット',
              scatterPlot: '散布図',
              linePlot: '折れ線グラフ'
            },
            correlation: {
              title: '相関ヒートマップ',
              filterLowCorrelation: '低相関をフィルター',
              threshold: 'しきい値',
              coefficient: '相関係数'
            },
            selectColumn: '可視化する列を選択してください',
            errorDrawing: 'グラフの描画に失敗しました'
          }
        }
      },
      en: {
        translation: {
          visualization: 'Visualization',
          regression: 'Regression Analysis',
          classification: 'Classification Analysis',
          dataPreview: 'Data Preview',
          appName: 'VisionaryLens',
          fileUpload: {
            dragText: 'Click or drag file to this area',
            supportText: 'Support Excel (.xlsx, .xls) or CSV files',
            currentFile: 'Current file: ',
            reupload: 'Re-upload',
            sampleFiles: 'Or load sample files:',
            uploadSuccess: 'File uploaded successfully',
            uploadError: 'Failed to parse file',
            readError: 'Failed to read file',
            noData: 'No valid data in file',
            loadSampleError: 'Failed to load sample file',
            loadSampleSuccess: 'Sample file loaded successfully',
            sampleFilePrefix: 'Sample file: '
          },
          visualization: {
            numericFeatures: 'Numeric Features',
            categoricalFeatures: 'Categorical Features',
            dataTransformation: 'Data Transformation',
            chartType: 'Chart Type',
            charts: {
              pieChart: 'Pie Chart',
              histogram: 'Histogram',
              boxPlot: 'Box Plot',
              violinPlot: 'Violin Plot',
              densityPlot: 'Density Plot',
              scatterPlot: 'Scatter Plot',
              linePlot: 'Line Plot'
            },
            correlation: {
              title: 'Feature Correlation Heatmap',
              filterLowCorrelation: 'Filter Low Correlation',
              threshold: 'Threshold',
              coefficient: 'Correlation Coefficient'
            },
            selectColumn: 'Please select a column to visualize',
            errorDrawing: 'Error drawing chart'
          }
        }
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 
from pycaret import classification, regression
import pandas as pd

def perform_model_analysis(data, target_column, problem_type, numeric_columns, categorical_columns):

    data = pd.DataFrame(data)
    data.columns = data.iloc[0]
    data = data.iloc[1:]
    data.dropna(inplace=True)
    data.drop_duplicates(inplace=True)
    #Regression or Classification
    if problem_type == 'regression':
        regression.setup(data=data, target=target_column, session_id=123)
        best_model = regression.compare_models()
        print(best_model)
        results_df = regression.pull()
        print(results_df)
    elif problem_type == 'classification':
        classification.setup(data=data, target=target_column, session_id=123)
        best_model = classification.compare_models()
        print(best_model)
        results_df = classification.pull()
        print(results_df)
    
    return (best_model, results_df)
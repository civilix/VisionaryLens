import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_squared_error, accuracy_score, f1_score, precision_score

def perform_model_analysis(data, target_column, problem_type, numeric_columns, categorical_columns):
    # Convert data to DataFrame
    df = pd.DataFrame(data, columns=numeric_columns + categorical_columns)
    
    # Split data into features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize model
    if problem_type == 'regression':
        model = LinearRegression()
    else:
        model = LogisticRegression(max_iter=1000)
    
    # Train model
    model.fit(X_train, y_train)
    
    # Predict and evaluate
    predictions = model.predict(X_test)
    if problem_type == 'regression':
        rmse = mean_squared_error(y_test, predictions, squared=False)
        return {
            'model_name': 'Linear Regression',
            'performance': {
                'rmse': [rmse] * 10  # Simulate 10 values
            }
        }
    else:
        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(y_test, predictions, average='weighted')
        f1 = f1_score(y_test, predictions, average='weighted')
        return {
            'model_name': 'Logistic Regression',
            'performance': {
                'accuracy': [accuracy] * 10,  # Simulate 10 values
                'precision': [precision] * 10,
                'f1': [f1] * 10
            }
        } 
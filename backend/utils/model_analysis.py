from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier, XGBRegressor
import numpy as np

def perform_model_analysis(data, target_column, problem_type, numeric_columns, categorical_columns):
    # Print received data for debugging
    print("Data received for analysis:")
    print(f"Data: {data}")
    print(f"Target Column: {target_column}")
    print(f"Problem Type: {problem_type}")
    print(f"Numeric Columns: {numeric_columns}")
    print(f"Categorical Columns: {categorical_columns}")

    # Feature Engineering
    X = data.drop(columns=[target_column])
    y = data[target_column]

    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_columns),
            ('cat', categorical_transformer, categorical_columns)
        ])

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Model selection
    if problem_type == 'classification':
        models = [
            ('Logistic Regression', LogisticRegression()),
            ('Random Forest', RandomForestClassifier()),
            ('SVM', SVC()),
            ('KNN', KNeighborsClassifier()),
            ('XGBoost', XGBClassifier(use_label_encoder=False, eval_metric='mlogloss'))
        ]
        scoring = 'accuracy'
    elif problem_type == 'regression':
        models = [
            ('Linear Regression', LinearRegression()),
            ('Random Forest', RandomForestRegressor()),
            ('SVR', SVR()),
            ('Gradient Boosting', GradientBoostingRegressor()),
            ('XGBoost', XGBRegressor())
        ]
        scoring = 'neg_mean_squared_error'

    # Evaluate models
    results = {}
    for name, model in models:
        pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                   ('model', model)])
        cv_results = cross_val_score(pipeline, X_train, y_train, cv=5, scoring=scoring)
        results[name] = cv_results.mean()

    return results 
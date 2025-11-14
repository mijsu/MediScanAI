#!/usr/bin/env python3
"""
Train health risk prediction models using scikit-learn and XGBoost
Saves trained models as .pkl files for production use
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_data(n_samples=2000):
    """
    Generate synthetic health data based on medical guidelines
    Features: WBC, RBC, Hemoglobin, Platelets, Cholesterol, HDL, LDL, Triglycerides, Glucose, A1C, pH, Protein
    Target: Risk level (0=low, 1=moderate, 2=high)
    """
    data = []
    
    for _ in range(n_samples):
        # Randomly assign risk category
        risk = np.random.choice([0, 1, 2], p=[0.5, 0.3, 0.2])  # 50% low, 30% moderate, 20% high
        
        if risk == 2:  # High risk
            wbc = np.random.uniform(3.5, 20.0)  # Abnormal range
            glucose = np.random.uniform(126, 250)  # Diabetic
            cholesterol = np.random.uniform(240, 320)  # High
            ldl = np.random.uniform(160, 220)
            hdl = np.random.uniform(20, 40)  # Low (bad)
            triglycerides = np.random.uniform(200, 400)
            a1c = np.random.uniform(6.5, 12.0)
        elif risk == 1:  # Moderate risk
            wbc = np.random.uniform(4.0, 12.0)
            glucose = np.random.uniform(100, 125)  # Prediabetic
            cholesterol = np.random.uniform(200, 239)  # Borderline
            ldl = np.random.uniform(130, 159)
            hdl = np.random.uniform(40, 50)
            triglycerides = np.random.uniform(150, 199)
            a1c = np.random.uniform(5.7, 6.4)
        else:  # Low risk
            wbc = np.random.uniform(4.5, 11.0)  # Normal
            glucose = np.random.uniform(70, 99)  # Normal
            cholesterol = np.random.uniform(125, 199)  # Healthy
            ldl = np.random.uniform(50, 129)
            hdl = np.random.uniform(50, 90)  # Good
            triglycerides = np.random.uniform(50, 149)
            a1c = np.random.uniform(4.0, 5.6)
        
        # Other features with normal ranges
        rbc = np.random.uniform(4.2, 5.9)
        hemoglobin = np.random.uniform(12.0, 17.5)
        platelets = np.random.uniform(150, 400)
        ph = np.random.uniform(4.5, 8.0)
        protein = np.random.choice([0, 1], p=[0.8, 0.2])  # 0=Negative, 1=Positive
        
        data.append([
            wbc, rbc, hemoglobin, platelets,
            cholesterol, hdl, ldl, triglycerides,
            glucose, a1c, ph, protein,
            risk
        ])
    
    columns = [
        'wbc', 'rbc', 'hemoglobin', 'platelets',
        'cholesterol', 'hdl', 'ldl', 'triglycerides',
        'glucose', 'a1c', 'ph', 'protein',
        'risk_level'
    ]
    
    return pd.DataFrame(data, columns=columns)

def train_models():
    """Train and save gradient boosting and logistic regression models"""
    
    print("🧠 Training health risk prediction models...\n")
    
    # Generate synthetic training data
    print("📊 Generating synthetic medical data...")
    df = generate_synthetic_data(n_samples=2000)
    
    # Split features and target
    X = df.drop('risk_level', axis=1)
    y = df['risk_level']
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}\n")
    
    # 1. Train StandardScaler
    print("🔧 Training feature scaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 2. Train Gradient Boosting Classifier
    print("🌲 Training Gradient Boosting model...")
    gb_model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        verbose=0
    )
    gb_model.fit(X_train_scaled, y_train)
    gb_pred = gb_model.predict(X_test_scaled)
    gb_accuracy = accuracy_score(y_test, gb_pred)
    
    print(f"   Accuracy: {gb_accuracy:.3f}")
    
    # 3. Train Logistic Regression
    print("📈 Training Logistic Regression model...")
    lr_model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        multi_class='multinomial'
    )
    lr_model.fit(X_train_scaled, y_train)
    lr_pred = lr_model.predict(X_test_scaled)
    lr_accuracy = accuracy_score(y_test, lr_pred)
    
    print(f"   Accuracy: {lr_accuracy:.3f}\n")
    
    # Print detailed classification report for best model
    print("📊 Gradient Boosting Classification Report:")
    print(classification_report(y_test, gb_pred, target_names=['Low', 'Moderate', 'High']))
    
    # Save models
    save_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
    os.makedirs(save_dir, exist_ok=True)
    
    print("\n💾 Saving models...")
    
    scaler_path = os.path.join(save_dir, 'scaler.pkl')
    gb_path = os.path.join(save_dir, 'gradient_boosting.pkl')
    lr_path = os.path.join(save_dir, 'logistic_regression.pkl')
    info_path = os.path.join(save_dir, 'model_info.txt')
    
    joblib.dump(scaler, scaler_path)
    joblib.dump(gb_model, gb_path)
    joblib.dump(lr_model, lr_path)
    
    # Save model info
    with open(info_path, 'w') as f:
        f.write("MEDiscan Health Risk Prediction Models\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Gradient Boosting Accuracy: {gb_accuracy:.3f}\n")
        f.write(f"Logistic Regression Accuracy: {lr_accuracy:.3f}\n\n")
        f.write("Features (12):\n")
        f.write("  - WBC, RBC, Hemoglobin, Platelets\n")
        f.write("  - Cholesterol, HDL, LDL, Triglycerides\n")
        f.write("  - Glucose, A1C, pH, Protein\n\n")
        f.write("Target Classes (3):\n")
        f.write("  - 0: Low Risk\n")
        f.write("  - 1: Moderate Risk\n")
        f.write("  - 2: High Risk\n")
    
    print(f"   ✓ Scaler saved to: {scaler_path}")
    print(f"   ✓ Gradient Boosting saved to: {gb_path}")
    print(f"   ✓ Logistic Regression saved to: {lr_path}")
    print(f"   ✓ Model info saved to: {info_path}")
    
    print("\n✨ Training complete! Models ready for production.\n")
    
    return {
        'scaler': scaler,
        'gradient_boosting': gb_model,
        'logistic_regression': lr_model,
        'gb_accuracy': gb_accuracy,
        'lr_accuracy': lr_accuracy
    }

if __name__ == '__main__':
    train_models()

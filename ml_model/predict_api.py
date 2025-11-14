#!/usr/bin/env python3
"""
Flask API for health risk predictions using trained scikit-learn models
Loads .pkl models and provides REST endpoint for predictions
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global model storage
models = {
    'scaler': None,
    'gradient_boosting': None,
    'logistic_regression': None
}

# Risk level mapping
RISK_LEVELS = {
    0: 'low',
    1: 'moderate',
    2: 'high'
}

def load_models():
    """Load all trained models from saved_models/ directory"""
    save_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
    
    try:
        scaler_path = os.path.join(save_dir, 'scaler.pkl')
        gb_path = os.path.join(save_dir, 'gradient_boosting.pkl')
        lr_path = os.path.join(save_dir, 'logistic_regression.pkl')
        
        if not all(os.path.exists(p) for p in [scaler_path, gb_path, lr_path]):
            raise FileNotFoundError("Model files not found. Please run train_model.py first.")
        
        models['scaler'] = joblib.load(scaler_path)
        models['gradient_boosting'] = joblib.load(gb_path)
        models['logistic_regression'] = joblib.load(lr_path)
        
        print("✅ Models loaded successfully!")
        print(f"   - Scaler: {scaler_path}")
        print(f"   - Gradient Boosting: {gb_path}")
        print(f"   - Logistic Regression: {lr_path}\n")
        
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

def parse_value(value, default=0.0):
    """Parse value from string or number"""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            # Handle special cases like "Positive", "Negative"
            if value.lower() in ['positive', 'trace']:
                return 1.0
            return default
    return default

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    models_loaded = all(v is not None for v in models.values())
    return jsonify({
        'status': 'healthy' if models_loaded else 'unhealthy',
        'models_loaded': models_loaded
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict health risk from lab values
    
    Expected JSON format:
    {
        "wbc": 8.5,
        "glucose": "110",
        "cholesterol": 220,
        ...
    }
    
    Returns:
    {
        "riskLevel": "moderate",
        "riskScore": 55,
        "confidence": 87,
        "model": "gradient_boosting"
    }
    """
    try:
        # Check if models are loaded
        if not all(v is not None for v in models.values()):
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract and parse lab values with feature names
        # Use default values from medical normal ranges
        feature_names = ['wbc', 'rbc', 'hemoglobin', 'platelets', 'cholesterol', 
                        'hdl', 'ldl', 'triglycerides', 'glucose', 'a1c', 'ph', 'protein']
        
        features_dict = {
            'wbc': parse_value(data.get('wbc'), 7.5),
            'rbc': parse_value(data.get('rbc'), 4.7),
            'hemoglobin': parse_value(data.get('hemoglobin'), 14.0),
            'platelets': parse_value(data.get('platelets'), 250),
            'cholesterol': parse_value(data.get('cholesterol'), 180),
            'hdl': parse_value(data.get('hdl'), 55),
            'ldl': parse_value(data.get('ldl'), 100),
            'triglycerides': parse_value(data.get('triglycerides'), 140),
            'glucose': parse_value(data.get('glucose'), 95),
            'a1c': parse_value(data.get('a1c'), 5.4),
            'ph': parse_value(data.get('ph'), 6.0),
            'protein': parse_value(data.get('protein'), 0.0),
        }
        
        # Convert to DataFrame to preserve feature names
        X = pd.DataFrame([features_dict], columns=feature_names)
        
        # Scale features
        X_scaled = models['scaler'].transform(X)
        
        # Predict using Gradient Boosting (primary model)
        risk_class = models['gradient_boosting'].predict(X_scaled)[0]
        risk_probabilities = models['gradient_boosting'].predict_proba(X_scaled)[0]
        
        # Get risk level and confidence
        risk_level = RISK_LEVELS[risk_class]
        confidence = int(risk_probabilities[risk_class] * 100)
        
        # Calculate risk score (0-100 scale)
        # Weighted by probabilities: low=15, moderate=50, high=85
        risk_score = int(
            risk_probabilities[0] * 15 +  # Low risk contribution
            risk_probabilities[1] * 50 +  # Moderate risk contribution
            risk_probabilities[2] * 85    # High risk contribution
        )
        
        return jsonify({
            'riskLevel': risk_level,
            'riskScore': risk_score,
            'confidence': confidence,
            'model': 'gradient_boosting',
            'probabilities': {
                'low': float(risk_probabilities[0]),
                'moderate': float(risk_probabilities[1]),
                'high': float(risk_probabilities[2])
            }
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Prediction error: {e}")
        print(f"Full traceback:\n{error_details}")
        return jsonify({'error': str(e), 'details': error_details}), 500

@app.route('/predict/ensemble', methods=['POST'])
def predict_ensemble():
    """
    Ensemble prediction using both Gradient Boosting and Logistic Regression
    Averages the predictions for more robust results
    """
    try:
        # Check if models are loaded
        if not all(v is not None for v in models.values()):
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract features with feature names (same as predict endpoint)
        feature_names = ['wbc', 'rbc', 'hemoglobin', 'platelets', 'cholesterol', 
                        'hdl', 'ldl', 'triglycerides', 'glucose', 'a1c', 'ph', 'protein']
        
        features_dict = {
            'wbc': parse_value(data.get('wbc'), 7.5),
            'rbc': parse_value(data.get('rbc'), 4.7),
            'hemoglobin': parse_value(data.get('hemoglobin'), 14.0),
            'platelets': parse_value(data.get('platelets'), 250),
            'cholesterol': parse_value(data.get('cholesterol'), 180),
            'hdl': parse_value(data.get('hdl'), 55),
            'ldl': parse_value(data.get('ldl'), 100),
            'triglycerides': parse_value(data.get('triglycerides'), 140),
            'glucose': parse_value(data.get('glucose'), 95),
            'a1c': parse_value(data.get('a1c'), 5.4),
            'ph': parse_value(data.get('ph'), 6.0),
            'protein': parse_value(data.get('protein'), 0.0),
        }
        
        # Convert to DataFrame to preserve feature names
        X = pd.DataFrame([features_dict], columns=feature_names)
        X_scaled = models['scaler'].transform(X)
        
        # Get predictions from both models
        gb_proba = models['gradient_boosting'].predict_proba(X_scaled)[0]
        lr_proba = models['logistic_regression'].predict_proba(X_scaled)[0]
        
        # Average probabilities (ensemble)
        avg_proba = (gb_proba + lr_proba) / 2
        risk_class = np.argmax(avg_proba)
        
        risk_level = RISK_LEVELS[risk_class]
        confidence = int(avg_proba[risk_class] * 100)
        risk_score = int(
            avg_proba[0] * 15 + avg_proba[1] * 50 + avg_proba[2] * 85
        )
        
        return jsonify({
            'riskLevel': risk_level,
            'riskScore': risk_score,
            'confidence': confidence,
            'model': 'ensemble',
            'probabilities': {
                'low': float(avg_proba[0]),
                'moderate': float(avg_proba[1]),
                'high': float(avg_proba[2])
            }
        })
        
    except Exception as e:
        print(f"Ensemble prediction error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Starting MEDiscan ML Prediction API...\n")
    
    # Load models on startup
    if load_models():
        print("🌐 Starting Flask server on http://localhost:5001")
        print("   Endpoints:")
        print("   - GET  /health              (Health check)")
        print("   - POST /predict             (Single model prediction)")
        print("   - POST /predict/ensemble    (Ensemble prediction)\n")
        
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("❌ Failed to load models. Please run train_model.py first.")
        exit(1)

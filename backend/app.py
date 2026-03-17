from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

# ── LOAD MODEL + ARTIFACTS ─────────────────────────────────
model  = joblib.load('churn_model.pkl')
scaler = joblib.load('scaler.pkl')

with open('feature_names.json') as f:
    feature_names = json.load(f)

scale_cols = ['tenure', 'MonthlyCharges', 'TotalCharges',
              'total_services', 'risk_score',
              'charge_per_tenure', 'monthly_to_total_ratio',
              'cost_per_service']

# ── FEATURE ENGINEERING ────────────────────────────────────
def engineer_features(data):
    df = pd.DataFrame([data])

    services = ['PhoneService', 'MultipleLines', 'InternetService',
                'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
                'TechSupport', 'StreamingTV', 'StreamingMovies']
    df['total_services'] = df[services].apply(
        lambda x: (x != 0).sum(), axis=1)

    df['risk_score'] = (
        (df['Contract'] == 0).astype(int) +
        (df['OnlineSecurity'] == 0).astype(int) +
        (df['TechSupport'] == 0).astype(int) +
        (df['MonthlyCharges'] > 65).astype(int) +
        (df['tenure'] < 12).astype(int)
    )

    df['charge_per_tenure']      = df['MonthlyCharges'] / (df['tenure'] + 1)
    df['monthly_to_total_ratio'] = df['MonthlyCharges'] / (df['TotalCharges'] + 1)
    df['cost_per_service']       = df['MonthlyCharges'] / (df['total_services'] + 1)

    return df

# ── RISK GROUP ─────────────────────────────────────────────
def get_risk_group(prob):
    if prob >= 0.70:
        return 'High Risk'
    elif prob >= 0.40:
        return 'Medium Risk'
    else:
        return 'Low Risk'

# ── RETENTION STRATEGIES ───────────────────────────────────
def get_retention_strategy(prob, data):
    strategies = []
    if data.get('Contract') == 0:
        strategies.append("Offer discounted annual or two-year contract upgrade")
    if data.get('OnlineSecurity') == 0:
        strategies.append("Offer free 3-month online security trial")
    if data.get('TechSupport') == 0:
        strategies.append("Offer complimentary tech support package")
    if prob >= 0.70:
        strategies.append("Assign dedicated retention agent immediately")
        strategies.append("Offer personalized loyalty discount of 10-20%")
    if data.get('tenure', 0) < 12:
        strategies.append("Send welcome loyalty program invitation")
    if not strategies:
        strategies.append("Monitor customer — low immediate risk")
    return strategies

# ── ROUTES ─────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({"status": "Churn Prediction API is running!"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        # Feature engineering
        df = engineer_features(data)

        # Align columns
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        df = df[feature_names]

        # Scale
        cols_to_scale = [c for c in scale_cols if c in df.columns]
        df[cols_to_scale] = scaler.transform(df[cols_to_scale])

        # Predict
        churn_prob = float(model.predict_proba(df)[0][1])
        prediction = int(churn_prob >= 0.5)
        risk_group = get_risk_group(churn_prob)
        strategies = get_retention_strategy(churn_prob, data)
        clv        = data.get('MonthlyCharges', 0) * 12

        return jsonify({
            "churn_prediction":     prediction,
            "churn_probability":    round(churn_prob * 100, 2),
            "risk_group":           risk_group,
            "clv_estimate":         round(clv, 2),
            "retention_strategies": strategies
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
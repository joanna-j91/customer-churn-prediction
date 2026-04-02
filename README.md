## Project Demo :
- **Frontend:** [https://churn-predictor-sigma.vercel.app](https://churn-predictor-sigma.vercel.app)
- **Backend API:** [https://churn-predictor-api.onrender.com](https://churn-predictor-api.onrender.com)

## Problem Statement
Customer churn is a major challenge for telecom companies. Predicting which customers are likely to leave allows companies to intervene with targeted retention strategies before it's too late. Our system builds a machine learning pipeline that:
- Predicts whether a customer will churn (Yes / No)
- Provides a churn probability score
- Identifies key factors influencing churn
- Segments customers into risk groups (Low / Medium / High)
- Suggests personalized retention strategies

- We are using the Telco Customer Churn Dataset to train and test our model

## ML Pipeline
### 1. Data Preprocessing:
- Rows with null values were dropped
- Boxplots were plotted to visualize outliers, however, no outliers were found.
### 2. Feature Engineering
- Created 'risk-score' and 'service-count' to aid in churn classification
- Created 3 ratio-based features, i.e., 'charge_per_tenure', 'monthly_to_total_ratio', 'cost_per_service'
- Highly correlated features were dropped after plotting the correlation heatmap
## 3. Encoding
- **LabelEncoder:** used for binary values
- **OrdinalEncoder:** used to encode 'contract' column by preserving their ordinality
- **OneHotEncoder:** used to encode multi-value columns
### 5. Train / Test Split
- Train/Test split was performed (80/20 (split))
- Training set: 5,625 samples | Test set: 1,407 samples
## Perform SMOTE to handle class imbalance
- Balanced churned class from 1,495 → 4,130 samples
- Final training set: 8,260 samples (perfectly balanced)
- Scaling using **StandardScaler** was fit on training set.

## Models Trained
| Model | Accuracy | Balanced Accuracy | F1 Score | Recall | ROC-AUC |

| Logistic Regression | 78.25% | 73.68% | 60.97% | 63.90% | 82.83% |

| Random Forest | 77.68% | 71.58% | 58.24% | 58.56% | 81.26% |

| Gradient Boosting | 76.40% | 72.84% | 59.51% | 65.24% | 82.63% |

| **XGBoost** | **72.57%** | **73.64%** | **60.00%** | **75.94%** | **81.50%** |

For churn prediction, recall and balanced accuracy score are two of the most important metrics to evaluate a model's performance.
According to this criteris, we have concluded that **XGBoost** has the highest performance, and hence would be used to further develop the system.

## Feature Importance

Top features influencing churn (XGBoost):

| Rank | Feature | Importance | Insight |
| 1 | `Contract` | 0.365 | Month-to-month customers churn the most |
| 2 | `InternetService_Fiber optic` | 0.138 | Fiber users churn more (expensive service) |
| 3 | `PaymentMethod_Electronic check` | 0.083 | Least committed payment method |
| 4 | `StreamingTV_Yes` | 0.034 | Streaming users slightly higher risk |
| 5 | `Dependents` | 0.028 | Customers without dependents churn more |
| 6-10 | `charge_per_tenure`, `cost_per_service`, `risk_score` | — | Engineered features validated |

## Customer Lifetime Value (CLV)

CLV is estimated as:
```
CLV = Monthly Charges × 12 months
Priority Score = CLV × Churn Probability
```

Customers are segmented into Low / Medium / High priority based on priority score, helping businesses focus retention efforts on the most valuable at-risk customers.

## Retention Strategies

The system generates personalized retention strategies based on customer profile:

| Condition | Strategy |
| Month-to-month contract | Offer discounted annual or two-year contract upgrade |
| No online security | Offer free 3-month online security trial |
| No tech support | Offer complimentary tech support package |
| Churn probability ≥ 70% | Assign dedicated retention agent + 10-20% loyalty discount |
| Tenure < 12 months | Send welcome loyalty program invitation |

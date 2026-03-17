const API = 'http://localhost:5000';

  async function predict() {
    const btn = document.querySelector('.predict-btn');
    btn.textContent = 'Predicting...';
    btn.disabled = true;

    const fields = [
      'tenure','MonthlyCharges','TotalCharges','Contract',
      'InternetService','PaymentMethod','OnlineSecurity',
      'TechSupport','PhoneService','MultipleLines',
      'StreamingTV','StreamingMovies','OnlineBackup',
      'DeviceProtection','gender','SeniorCitizen',
      'Partner','Dependents','PaperlessBilling'
    ];

    const data = {};
    fields.forEach(f => {
      const el = document.getElementById(f);
      data[f] = parseFloat(el.value);
    });

    try {
      const res  = await fetch(`${API}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      });
      const result = await res.json();
      showResult(result);
    } catch (err) {
      alert('Error connecting to API. Make sure backend is running.');
    }

    btn.textContent = 'Predict Churn Risk';
    btn.disabled = false;
  }

  function showResult(r) {
    document.getElementById('placeholder').style.display = 'none';
    const results = document.getElementById('results');
    results.style.display = 'flex';

    // Verdict
    const verdict = document.getElementById('verdict');
    if (r.churn_prediction === 1) {
      verdict.className = 'verdict churn';
      verdict.textContent = 'LIKELY TO CHURN';
    } else {
      verdict.className = 'verdict no-churn';
      verdict.textContent = 'LIKELY TO STAY';
    }

    // Probability bar
    document.getElementById('probFill').style.width = r.churn_probability + '%';
    document.getElementById('probPct').textContent  = r.churn_probability + '%';

    // Risk badge
    const risk = r.risk_group.split(' ')[0];
    document.getElementById('riskBadge').innerHTML =
      `<span class="risk-badge risk-${risk}">${r.risk_group}</span>`;

    // CLV
    document.getElementById('clvVal').textContent = '$' + r.clv_estimate;

    // Strategies
    const container = document.getElementById('strategies');
    container.innerHTML = r.retention_strategies
      .map(s => `<div class="strategy-item">${s}</div>`)
      .join('');
  }
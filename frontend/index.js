
const API = 'https://churn-prediction-api-cuvg.onrender.com'; 

const stats = { total: 0, high: 0, medium: 0, low: 0 };

const FEATURE_IMPORTANCE = [
  { name: 'Contract Type',        score: 0.365 },
  { name: 'Fiber Optic Internet', score: 0.138 },
  { name: 'Electronic Check',     score: 0.083 },
  { name: 'Streaming TV',         score: 0.034 },
  { name: 'Dependents',           score: 0.028 },
];

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API}/health`);
    if (res.ok) {
      setApiStatus(true);
    } else {
      setApiStatus(false);
    }
  } catch {
    setApiStatus(false);
  }
});

function setApiStatus(online) {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.api-status span:last-child');
  if (online) {
    dot.style.background  = 'var(--green)';
    dot.style.boxShadow   = '0 0 8px var(--green)';
    text.textContent      = 'API Connected';
  } else {
    dot.style.background  = 'var(--red)';
    dot.style.boxShadow   = '0 0 8px var(--red)';
    text.textContent      = 'API Offline';
  }
}

function getFormData() {
  const fields = [
    'tenure', 'MonthlyCharges', 'TotalCharges', 'Contract',
    'InternetService', 'PaymentMethod', 'OnlineSecurity',
    'TechSupport', 'PhoneService', 'MultipleLines',
    'StreamingTV', 'StreamingMovies', 'OnlineBackup',
    'DeviceProtection', 'gender', 'SeniorCitizen',
    'Partner', 'Dependents', 'PaperlessBilling'
  ];
  const data = {};
  fields.forEach(f => {
    data[f] = parseFloat(document.getElementById(f).value);
  });
  return data;
}

async function predict() {
  const btn = document.getElementById('predictBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.querySelector('.btn-text').textContent = 'Analysing...';

  const data = getFormData();

  try {
    const res    = await fetch(`${API}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });

    if (!res.ok) throw new Error('API error');
    const result = await res.json();
    renderResults(result, data);
    updateSessionStats(result.risk_group);

  } catch (err) {
    showError('Could not connect to API. Make sure the backend is running.');
  }

  btn.disabled = false;
  btn.classList.remove('loading');
  btn.querySelector('.btn-text').textContent = 'Analyse Customer';
}

function renderResults(result, inputData) {
  document.getElementById('placeholder').style.display = 'none';
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'flex';

  const prob    = result.churn_probability;
  const isChurn = result.churn_prediction === 1;
  const risk    = result.risk_group;

  renderVerdict(isChurn, prob, risk);
  renderGauge(prob);
  renderStatCards(result);
  renderFeatureImportance();
  renderStrategies(result.retention_strategies);

  if (window.innerWidth < 900) {
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderVerdict(isChurn, prob, risk) {
  const block = document.getElementById('verdictBlock');
  const text  = document.getElementById('verdictText');
  const sub   = document.getElementById('verdictSub');

  block.className = 'verdict-block ' + (isChurn ? 'churn' : 'stay');
  text.className  = 'verdict-text '  + (isChurn ? 'churn' : 'stay');

  text.textContent = isChurn ? 'LIKELY TO CHURN' : 'LIKELY TO STAY';
  sub.textContent  = `${prob}% churn probability — ${risk}`;
}

function renderGauge(prob) {
  const fill   = document.getElementById('gaugeFill');
  const needle = document.getElementById('gaugeNeedle');
  const pct    = document.getElementById('gaugePct');

  const totalLength = 283;
  const offset      = totalLength - (totalLength * prob / 100);

  let color;
  if      (prob >= 70) color = 'var(--red)';
  else if (prob >= 40) color = 'var(--amber)';
  else                 color = 'var(--green)';

  fill.style.stroke          = color;
  fill.style.strokeDashoffset = offset;

  const angle = -90 + (prob / 100 * 180);
  needle.setAttribute('transform', `rotate(${angle}, 100, 110)`);

  animateCounter(pct, 0, prob, 800, '%');
  pct.style.color = color;
}

function renderStatCards(result) {
  const risk    = result.risk_group.split(' ')[0];
  const riskEl  = document.getElementById('riskVal');
  const clvEl   = document.getElementById('clvVal');
  const probEl  = document.getElementById('probVal');
  const riskCard = document.getElementById('riskCard');

  riskEl.innerHTML = `<span class="risk-badge risk-${risk}">${result.risk_group}</span>`;
  clvEl.textContent  = `$${result.clv_estimate.toLocaleString()}`;
  probEl.textContent = `${result.churn_probability}%`;

  if (result.churn_probability >= 70)      probEl.style.color = 'var(--red)';
  else if (result.churn_probability >= 40) probEl.style.color = 'var(--amber)';
  else                                     probEl.style.color = 'var(--green)';
}

function renderFeatureImportance() {
  const container = document.getElementById('featBars');
  container.innerHTML = '';

  const maxScore = FEATURE_IMPORTANCE[0].score;

  FEATURE_IMPORTANCE.forEach((feat, i) => {
    const pct = (feat.score / maxScore * 100).toFixed(0);
    const row = document.createElement('div');
    row.className = 'feat-row';
    row.style.animationDelay = `${i * 0.07}s`;
    row.innerHTML = `
      <div class="feat-name">${feat.name}</div>
      <div class="feat-track">
        <div class="feat-fill" data-pct="${pct}"></div>
      </div>
      <div class="feat-score">${feat.score.toFixed(3)}</div>
    `;
    container.appendChild(row);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.feat-fill').forEach(bar => {
      setTimeout(() => {
        bar.style.width = bar.dataset.pct + '%';
      }, 100);
    });
  });
}

function renderStrategies(strategies) {
  const container = document.getElementById('strategyList');
  container.innerHTML = '';

  strategies.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'strategy-item';
    item.style.animationDelay = `${i * 0.08}s`;
    item.innerHTML = `
      <span class="strategy-num">${String(i + 1).padStart(2, '0')}</span>
      <span>${s}</span>
    `;
    container.appendChild(item);
  });
}

function updateSessionStats(riskGroup) {
  stats.total++;
  if      (riskGroup === 'High Risk')   stats.high++;
  else if (riskGroup === 'Medium Risk') stats.medium++;
  else                                  stats.low++;

  animateCounter(document.getElementById('totalPredicted'), stats.total - 1, stats.total, 300);
  animateCounter(document.getElementById('highRiskCount'),  stats.high  - (riskGroup === 'High Risk'   ? 1 : 0), stats.high,   300);
  animateCounter(document.getElementById('medRiskCount'),   stats.medium - (riskGroup === 'Medium Risk' ? 1 : 0), stats.medium, 300);
  animateCounter(document.getElementById('lowRiskCount'),   stats.low   - (riskGroup === 'Low Risk'    ? 1 : 0), stats.low,    300);
}

function animateCounter(el, from, to, duration, suffix = '') {
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function showError(msg) {
  document.getElementById('placeholder').style.display = 'flex';
  document.getElementById('placeholder').innerHTML = `
    <div class="placeholder-icon" style="color:var(--red)">✕</div>
    <p style="color:var(--red)">${msg}</p>
  `;
  document.getElementById('results').style.display = 'none';
}
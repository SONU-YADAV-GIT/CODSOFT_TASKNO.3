 // ---------- state ----------
  const state = {
    current: '0',
    previous: null,
    operator: null,
    overwrite: true
  };

  const resultEl = document.getElementById('result');
  const expressionEl = document.getElementById('expression');

  // ---------- helpers ----------
  function formatNumber(num) {
    if (typeof num !== 'number' || !isFinite(num)) return 'Error';
    let rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
    let str = rounded.toString();
    if (str.replace('-', '').length > 12) {
      if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
        str = rounded.toExponential(5);
      } else {
        str = parseFloat(rounded.toPrecision(10)).toString();
      }
    }
    return str;
  }

  function compute(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    let result;
    if (op === '+') { result = a + b; }
    else if (op === '−') { result = a - b; }
    else if (op === '×') { result = a * b; }
    else if (op === '÷') {
      if (b === 0) { return null; } // signals divide-by-zero
      result = a / b;
    } else {
      return b;
    }
    return result;
  }

  function updateDisplay() {
    resultEl.textContent = state.current;
    expressionEl.textContent = state.previous !== null
      ? `${state.previous} ${state.operator ?? ''}`
      : '\u00A0';

    const len = state.current.replace('-', '').length;
    resultEl.classList.toggle('long', len > 8 && len <= 11);
    resultEl.classList.toggle('xlong', len > 11);
  }

  // ---------- actions ----------
  function inputDigit(d) {
    if (state.current === 'Error' || state.overwrite) {
      state.current = d;
      state.overwrite = false;
    } else {
      state.current = state.current === '0' ? d : state.current + d;
    }
  }

  function inputDecimal() {
    if (state.current === 'Error' || state.overwrite) {
      state.current = '0.';
      state.overwrite = false;
      return;
    }
    if (!state.current.includes('.')) state.current += '.';
  }

  function chooseOperator(op) {
    if (state.current === 'Error') return;

    if (state.operator && !state.overwrite) {
      const result = compute(state.previous, state.current, state.operator);
      if (result === null) {
        state.current = 'Error';
        state.previous = null;
        state.operator = null;
        state.overwrite = true;
        return;
      }
      state.current = formatNumber(result);
    }

    state.previous = state.current;
    state.operator = op;
    state.overwrite = true;
  }

  function handleEquals() {
    if (state.operator === null || state.current === 'Error') return;
    const result = compute(state.previous, state.current, state.operator);
    if (result === null) {
      state.current = 'Error';
    } else {
      state.current = formatNumber(result);
    }
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
  }

  function handleClear() {
    state.current = '0';
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
  }

  function handleDelete() {
    if (state.current === 'Error' || state.overwrite) {
      handleClear();
      return;
    }
    state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  }

  function handlePercent() {
    if (state.current === 'Error') return;
    state.current = formatNumber(parseFloat(state.current) / 100);
    state.overwrite = false;
  }

  function dispatch(action, payload) {
    if (action === 'number') inputDigit(payload);
    else if (action === 'decimal') inputDecimal();
    else if (action === 'operator') chooseOperator(payload);
    else if (action === 'equals') handleEquals();
    else if (action === 'clear') handleClear();
    else if (action === 'delete') handleDelete();
    else if (action === 'percent') handlePercent();
    updateDisplay();
  }

  // ---------- wire up buttons (loop over all keys) ----------
  const keyButtons = document.querySelectorAll('.key');
  keyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const payload = action === 'number' ? btn.dataset.num : btn.dataset.op;
      dispatch(action, payload);
    });
  });

  // ---------- keyboard support ----------
  const keyMap = {
    '+': () => dispatch('operator', '+'),
    '-': () => dispatch('operator', '−'),
    '*': () => dispatch('operator', '×'),
    '/': () => dispatch('operator', '÷'),
    'Enter': () => dispatch('equals'),
    '=': () => dispatch('equals'),
    'Backspace': () => dispatch('delete'),
    'Escape': () => dispatch('clear'),
    '%': () => dispatch('percent'),
    '.': () => dispatch('decimal')
  };

  document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      dispatch('number', e.key);
      flashKey(`[data-action="number"][data-num="${e.key}"]`);
      return;
    }
    if (keyMap[e.key]) {
      e.preventDefault();
      keyMap[e.key]();
      const opSelector = { '+':'+','-':'−','*':'×','/':'÷' }[e.key];
      if (opSelector) flashKey(`[data-op="${opSelector}"]`);
    }
  });

  function flashKey(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 120);
  }

  updateDisplay();
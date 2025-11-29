let _expected = 1;
let _start = 0;
let _gridId = 'shulteGrid';
let _timerInterval = null;
let _timerTarget = null;
let _hintElement = null;
let _touchLock = false;
let _currentTable = 1; // 1 - первая таблица, 2 - вторая с видео

function toNumber(val){
  const num = parseFloat(val);
  return Number.isNaN(num) ? null : num;
}

function accumulateSeconds(key, addition){
  const addValue = toNumber(addition);
  if (addValue === null) return;
  const prev = toNumber(localStorage.getItem(key)) || 0;
  const next = (prev + addValue).toFixed(1);
  localStorage.setItem(key, next);
}

function finalizeDiagnosticsSession(secondTime){
  const second = toNumber(secondTime);
  if (second === null) return;
  const first = toNumber(localStorage.getItem('diagnostics_first_temp'));
  if (first === null) return;

  const sessionSum = +(first + second).toFixed(1);
  const mean = +((sessionSum / 2).toFixed(1));
  accumulateSeconds('diagnostics_total_seconds', sessionSum);
  localStorage.setItem('diagnostics_mean_seconds', mean);
  localStorage.removeItem('diagnostics_first_temp');
}

function finalizeRepeatSession(secondTime){
  const second = toNumber(secondTime);
  if (second === null) return;
  const first = toNumber(localStorage.getItem('repeat_first_temp'));
  if (first === null) return;

  const sessionSum = +(first + second).toFixed(1);
  const mean = +((sessionSum / 2).toFixed(1));
  accumulateSeconds('repeat_total_seconds', sessionSum);
  localStorage.setItem('repeat_mean_seconds', mean);
  localStorage.removeItem('repeat_first_temp');
}

function getNums(){
  const arr = Array.from({length:25}, (_,i)=>i+1); // 1-25
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function updateHint() {
  if (!_hintElement) return;
  const numberEl = _hintElement.querySelector('.shulte-hint-number');
  if (numberEl) numberEl.textContent = _expected;
}

function createHintElement(containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return null;

  const boardSurface = grid.closest('.board-surface');
  if (!boardSurface) return null;

  const hintParent = grid.closest('.shulte-grid-panel') || boardSurface;
  if (!hintParent) return null;

  let hint = hintParent.querySelector('.shulte-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'shulte-hint';
    hint.innerHTML = `
      <div class="shulte-hint-label">Найдите и нажмите на цифру:</div>
      <div class="shulte-hint-number">1</div>
    `;
    if (grid.parentElement === hintParent) {
      hintParent.insertBefore(hint, grid);
    } else {
      hintParent.insertBefore(hint, hintParent.firstChild);
    }
  }
  return hint;
}

function renderGrid(containerId){
  const place = document.getElementById(containerId);
  if(!place) return;

  // удаляем старую подсказку
  if (_hintElement) {
    _hintElement.remove();
    _hintElement = null;
  }

  place.innerHTML = '';
  const nums = getNums();

  nums.forEach(n => {
    // Создаем кнопку вместо div
    const el = document.createElement('button');
    el.type = 'button'; // Предотвращаем submit формы если есть
    el.className = 'cell';
    el.innerText = n;
    el.dataset.number = n;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Нажмите на цифру ${n}`);

    // Отключаем выделение текста
    el.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    
    el.addEventListener('selectstart', function(e) {
      e.preventDefault();
      return false;
    });

    // Основной обработчик клика мышкой
    el.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      clickCell(n, el);
    });

    // Защита от двойного touch/click на мобильных
    el.addEventListener('touchstart', function(e) {
      if (_touchLock) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      _touchLock = true;
      setTimeout(() => _touchLock = false, 300);
      clickCell(n, el);
    }, { passive: false });

    place.appendChild(el);
  });

  place.classList.add('filled');

  // создаём подсказку
  _hintElement = createHintElement(containerId);
  updateHint();
}

function startShulte(isRepeat){
  _expected = 1;
  _start = Date.now();
  _currentTable = 1;

  const id = isRepeat ? 'shulteGridRepeat' : 'shulteGrid';
  _gridId = id;

  if (isRepeat) {
    const second = document.getElementById('repeat-exercise-second');
    if (second) second.style.display = 'none';
    const first = document.getElementById('repeat-exercise');
    if (first) first.style.display = 'grid';
  } else {
    const second = document.getElementById('exercise-second');
    if (second) second.style.display = 'none';
    const first = document.getElementById('exercise');
    if (first) first.style.display = 'grid';
  }

  renderGrid(id);

  const timerId = isRepeat ? 'timerRepeat' : 'timerPrimary';
  startTimer(timerId);

  setTimeout(() => {
    const firstCell = document.querySelector(`#${id} .cell`);
    if(firstCell) firstCell.focus();
  }, 100);
}

function startShulteForTest(){
  _expected = 1;
  _start = Date.now();
  _gridId = 'shulteGridTest';
  _currentTable = 1;

  renderGrid('shulteGridTest');
  startTimer('timerTest');

  setTimeout(() => {
    const firstCell = document.querySelector(`#shulteGridTest .cell`);
    if(firstCell) firstCell.focus();
  }, 100);
}

function clickCell(num, el){
  if (_start === 0) return;
  if (el.classList.contains('matched')) return;

  if (num === _expected) {
    el.classList.add('matched');
    el.style.pointerEvents = 'none';

    _expected++;
    updateHint();

    if (_expected > 25) finishGame();
  } else {
    el.animate(
      [
        {transform:'scale(1)', backgroundColor:'rgba(255,255,255,.14)'},
        {transform:'scale(.95)', backgroundColor:'rgba(244,67,54,.5)'},
        {transform:'scale(1)', backgroundColor:'rgba(255,255,255,.14)'}
      ],
      {duration:300}
    );
  }
}

function finishGame() {
  stopTimer();
  const time = ((Date.now() - _start)/1000).toFixed(1);

  if (_hintElement) _hintElement.style.display = 'none';

  const numericTime = parseFloat(time);
  const fixedTime = numericTime.toFixed(1);

  if (_gridId === 'shulteGrid') {
    if (typeof saveResult === 'function') saveResult('first', time);
    localStorage.setItem('diagnostics_first_temp', numericTime);
    localStorage.setItem('diagnostics_first_last', fixedTime);
  } else if (_gridId === 'shulteGridSecond') {
    if (typeof saveResult === 'function') saveResult('second', time);
    localStorage.setItem('diagnostics_second_last', fixedTime);
    finalizeDiagnosticsSession(numericTime);
  } else if (_gridId === 'shulteGridRepeat') {
    localStorage.setItem('repeat_first_temp', numericTime);
    localStorage.setItem('repeat_first_last', fixedTime);
  } else if (_gridId === 'shulteGridRepeatSecond') {
    localStorage.setItem('repeat_second_last', fixedTime);
    finalizeRepeatSession(numericTime);
  } else if (_gridId === 'shulteGridTest') {
    if (typeof saveResult === 'function') saveResult('first', time);
  } else if (_gridId === 'shulteGridTestSecond') {
    if (typeof saveResult === 'function') saveResult('second', time);
  } else if (typeof saveResult === 'function') {
    saveResult('second', time);
  }

  if (_gridId === 'shulteGrid' && _currentTable === 1) {
    _currentTable = 2;
    setTimeout(() => {
      alert(`Первая таблица завершена! Время: ${time} сек. Начинается вторая таблица с видео.`);
      showSecondTable();
    }, 300);
  } else if (_gridId === 'shulteGridRepeat' && _currentTable === 1) {
    _currentTable = 2;
    setTimeout(() => {
      alert(`Контрольная таблица завершена! Время: ${time} сек. Перейдите ко второй таблице.`);
      showRepeatSecondTable();
    }, 300);
  } else if (_gridId === 'shulteGridTest' && _currentTable === 1) {
    _currentTable = 2;
    setTimeout(() => {
      alert(`Первая таблица завершена! Время: ${time} сек. Начинается вторая таблица с видео.`);
      showSecondTableForTest();
    }, 300);
  } else {
    alert(`Готово! Время: ${time} сек`);
    _start = 0;
    _expected = 1;
    _currentTable = 1;
  }
}

function showSecondTable() {
  const firstSection = document.getElementById('exercise');
  if (firstSection) firstSection.style.display = 'none';

  const secondSection = document.getElementById('exercise-second');
  if (secondSection) {
    secondSection.style.display = 'grid';
    setTimeout(() => {
      startSecondTable();
    }, 500);
  }
}

function startSecondTable() {
  _expected = 1;
  _start = Date.now();
  _gridId = 'shulteGridSecond';

  renderGrid('shulteGridSecond');
  startTimer('timerSecond');

  setTimeout(() => {
    const firstCell = document.querySelector(`#shulteGridSecond .cell`);
    if(firstCell) firstCell.focus();
  }, 100);
}

function showRepeatSecondTable() {
  const firstSection = document.getElementById('repeat-exercise');
  if (firstSection) firstSection.style.display = 'none';

  const secondSection = document.getElementById('repeat-exercise-second');
  if (secondSection) {
    secondSection.style.display = 'grid';
    setTimeout(() => {
      startRepeatSecondTable();
    }, 500);
  }
}

function startRepeatSecondTable() {
  _expected = 1;
  _start = Date.now();
  _gridId = 'shulteGridRepeatSecond';

  renderGrid('shulteGridRepeatSecond');
  startTimer('timerRepeatSecond');

  setTimeout(() => {
    const firstCell = document.querySelector(`#shulteGridRepeatSecond .cell`);
    if(firstCell) firstCell.focus();
  }, 100);
}

function showSecondTableForTest() {
  // Скрываем первую таблицу
  const firstSection = document.getElementById('exercise-test');
  if (firstSection) firstSection.style.display = 'none';

  // Показываем вторую таблицу с фото
  const secondSection = document.getElementById('exercise-test-second');
  if (secondSection) {
    secondSection.style.display = 'grid';
    
    // Запускаем вторую таблицу
    setTimeout(() => {
      startSecondTableForTest();
    }, 500);
  }
}

function startSecondTableForTest() {
  _expected = 1;
  _start = Date.now();
  _gridId = 'shulteGridTestSecond';

  renderGrid('shulteGridTestSecond');
  startTimer('timerTestSecond');

  setTimeout(() => {
    const firstCell = document.querySelector(`#shulteGridTestSecond .cell`);
    if(firstCell) firstCell.focus();
  }, 100);
}

function resetShulte(){
  stopTimer();
  _expected = 1;
  _start = 0;
  _currentTable = 1;
  localStorage.removeItem('diagnostics_first_temp');
  localStorage.removeItem('repeat_first_temp');

  const ids = [
    'shulteGrid',
    'shulteGridRepeat',
    'shulteGridTest',
    'shulteGridSecond',
    'shulteGridTestSecond',
    'shulteGridRepeatSecond'
  ];
  let place = ids.map(id => document.getElementById(id)).find(el => el && el.classList.contains('filled'));

  if (place) {
    place.innerHTML = '';
    place.classList.remove('filled');
  }

  if (_hintElement) {
    _hintElement.remove();
    _hintElement = null;
  }

  const firstSection = document.getElementById('exercise');
  if (firstSection) firstSection.style.display = 'grid';
  const secondSection = document.getElementById('exercise-second');
  if (secondSection) secondSection.style.display = 'none';

  const repeatFirst = document.getElementById('repeat-exercise');
  if (repeatFirst) repeatFirst.style.display = 'grid';
  const repeatSecond = document.getElementById('repeat-exercise-second');
  if (repeatSecond) repeatSecond.style.display = 'none';

  const firstSectionTest = document.getElementById('exercise-test');
  if (firstSectionTest) firstSectionTest.style.display = 'grid';
  const secondSectionTest = document.getElementById('exercise-test-second');
  if (secondSectionTest) secondSectionTest.style.display = 'none';

  ['timerPrimary','timerRepeat','timerTest','timerSecond','timerTestSecond','timerRepeatSecond'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerText = '00.00.00';
  });
}

function startTimer(targetId){
  if (_timerInterval) clearInterval(_timerInterval);
  _timerTarget = targetId;
  updateTimerDisplay(0);

  _timerInterval = setInterval(() => {
    const elapsed = (Date.now() - _start)/1000;
    updateTimerDisplay(elapsed);
  }, 40);
}

function updateTimerDisplay(val){
  const el = document.getElementById(_timerTarget);
  if (!el) return;
  el.innerText = formatTime(val);
}

function stopTimer(){
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
}

function formatTime(total){
  const m = Math.floor(total/60).toString().padStart(2,'0');
  const s = Math.floor(total%60).toString().padStart(2,'0');
  const cs = Math.floor((total%1)*100).toString().padStart(2,'0');
  return `${m}.${s}.${cs}`;
}

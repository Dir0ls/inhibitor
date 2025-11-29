// main.js — вход / проверка пользователя / утилиты
function login(){
  const name = document.getElementById('username').value.trim();
  if(!name){ alert('Введите имя'); return; }
  localStorage.setItem('user', name);
  window.location = 'index.html';
}

window.addEventListener('load', () => {
  const user = localStorage.getItem('user');
  const box = document.getElementById('userName');
  if(box) box.innerText = user ? `Вы вошли как ${user}` : '';

  const current = location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = current === 'login.html';
  const isIndexPage = current === '' || current === 'index.html';

  if(!user && !isLoginPage && !isIndexPage){
    location.href = 'login.html';
  }
});

function saveResult(key, value){
  localStorage.setItem(key, value);
}

function clearResults(){
  localStorage.removeItem('first');
  localStorage.removeItem('second');
  localStorage.removeItem('diagnostics_total_seconds');
  localStorage.removeItem('repeat_total_seconds');
  localStorage.removeItem('diagnostics_first_temp');
  localStorage.removeItem('repeat_first_temp');
  localStorage.removeItem('diagnostics_mean_seconds');
  localStorage.removeItem('repeat_mean_seconds');
  localStorage.removeItem('diagnostics_first_last');
  localStorage.removeItem('diagnostics_second_last');
  localStorage.removeItem('repeat_first_last');
  localStorage.removeItem('repeat_second_last');
  location.reload();
}

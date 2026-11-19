(() => {
  const key = 'mersenne-lab-theme';
  let theme = 'light';
  try { const saved = localStorage.getItem(key); if (saved === 'dark' || saved === 'light') theme = saved; } catch {}
  const apply = () => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; };
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    const update = () => {
      apply();
      button.textContent = theme === 'dark' ? '☀ Светлая тема' : '☾ Тёмная тема';
      button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    };
    button.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(key, theme); } catch {} update(); });
    window.addEventListener('storage', event => { if (event.key === key) { theme = event.newValue === 'dark' ? 'dark' : 'light'; update(); } });
    update();
  });
})();

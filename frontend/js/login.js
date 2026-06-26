document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error-msg');
  errorEl.textContent = '';

  try {
    const { token, user } = await Api.login(username, password);
    setSession(token, user);
    window.location.href = '/index.html';
  } catch (err) {
    errorEl.textContent = err.message || 'Connexion impossible';
  }
});

// Si déjà connecté, redirection directe vers le dashboard
if (getToken()) {
  window.location.href = '/index.html';
}

const SUPABASE_URL = 'https://hqspmulzlnxzoshzstkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxc3BtdWx6bG54em9zaHpzdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTg5NTksImV4cCI6MjA5MzQzNDk1OX0.931PQhqvclzK1DwJNtp46sGoYxDD_Kk4bPtdINg7yi4';

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      await handleLogin(email, password);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      await handleRegister(email, password);
    });
  }
});

async function handleLogin(email, password) {
  const feedback = document.getElementById('login-feedback');
  if (feedback) feedback.textContent = '';

  const { error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) {
    if (feedback) feedback.textContent = error.message;
    return;
  }

  window.location.href = 'index.html#account';
}

async function handleRegister(email, password) {
  const feedback = document.getElementById('register-feedback');
  if (feedback) feedback.textContent = '';

  const { error } = await supabaseAuth.auth.signUp({ email, password }, { data: { role: 'customer' } });
  if (error) {
    if (feedback) feedback.textContent = error.message;
    return;
  }

  if (feedback) feedback.textContent = 'Registration successful. Confirm your email before logging in.';
}

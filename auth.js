const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    const user = db.users.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
        currentUser = user;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser)); 
        handleLoginSuccess(user);
    } else {
        loginMessage.textContent = 'Username atau password salah. Silakan coba lagi.';
        loginMessage.classList.add('error-message');
        loginMessage.classList.remove('success-message');
    }
});

function handleLoginSuccess(user) {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    loggedInUserSpan.textContent = `Selamat datang, ${user.username} (${user.skpd_id || user.unit_id || user.role})`;
    loginMessage.textContent = '';

    // Sesuaikan UI berdasarkan peran pengguna
    if (user.role === 'admin') {
        adminMenu.classList.remove('hidden');
        skpdUnitSelector.classList.add('hidden');
        document.getElementById('report-skpd-label').classList.remove('hidden');
        document.getElementById('report-filter-skpd').classList.remove('hidden');
        document.getElementById('report-unit-label').classList.remove('hidden');
        document.getElementById('report-filter-unit').classList.remove('hidden');
    } else if (user.role === 'skpd') {
        adminMenu.classList.add('hidden');
        skpdUnitSelector.classList.remove('hidden');
        populateSKPDUnitSelector();
        document.getElementById('report-skpd-label').classList.add('hidden'); 
        document.getElementById('report-filter-skpd').classList.add('hidden');
        document.getElementById('report-unit-label').classList.remove('hidden'); 
        document.getElementById('report-filter-unit').classList.remove('hidden');
    } else if (user.role === 'unit_skpd') {
        adminMenu.classList.add('hidden');
        skpdUnitSelector.classList.remove('hidden');
        populateSKPDUnitSelector();
        document.getElementById('report-skpd-label').classList.add('hidden');
        document.getElementById('report-filter-skpd').classList.add('hidden');
        document.getElementById('report-unit-label').classList.add('hidden');
        document.getElementById('report-filter-unit').classList.add('hidden');
    }

    // Default ke tampilan dashboard
    showSection('dashboard-section');
    updateDashboard();
}
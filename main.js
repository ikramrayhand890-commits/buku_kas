// Global state
let currentUser = null;
let db = {
    users: [],
    transactions: [],
    skpd_list: [],
    unit_skpd: {},
    saldo_awal: {}
};

// DOM elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loggedInUserSpan = document.getElementById('logged-in-user');
const logoutButton = document.getElementById('logout-button');

const navDashboard = document.getElementById('nav-dashboard');
const navInput = document.getElementById('nav-input');
const navLaporan = document.getElementById('nav-laporan');
const navAdmin = document.getElementById('nav-admin');
const adminMenu = document.getElementById('admin-menu');
const skpdUnitSelector = document.getElementById('skpd-unit-selector');
const skpdUnitSelect = document.getElementById('skpd-unit-select');

const dashboardSection = document.getElementById('dashboard-section');
const inputSection = document.getElementById('input-section');
const laporanSection = document.getElementById('laporan-section');
const adminSection = document.getElementById('admin-section');

// Fungsi untuk memuat data dari JSON (simulasi panggilan API)
async function loadDB() {
    try {
    const response = await fetch('data/db.json');
    db = await response.json();
    console.log('Database loaded:', db);

    // Cek apakah sudah ada user yang login
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        populateSKPDUnitSelector(); 
    } else {
        console.warn("Belum ada user login. Melewatkan populateSKPDUnitSelector().");
    }

} catch (error) {
    console.error('Error loading database:', error);
    alert('Gagal memuat data aplikasi. Silakan coba lagi.');
}

}

// Fungsi untuk menyimpan data ke JSON (mensimulasikan panggilan API - hanya untuk pengembangan)
// Dalam aplikasi nyata, ini akan menjadi panggilan API ke server backend.
async function saveDB() {
    try {
        // Dalam skenario nyata, Anda akan mengirim data ini ke backend.
        // Untuk simulasi sisi klien ini, kami hanya akan mencatatnya.
        console.log('Database saved (simulated):', db);
        // Anda juga dapat mempertimbangkan menggunakan localStorage untuk persistensi yang sangat mendasar
        // localStorage.setItem('buku_kas_db', JSON.stringify(db));
        alert('Data berhasil disimpan (simulasi).');
    } catch (error) {
        console.error('Error saving database:', error);
        alert('Gagal menyimpan data.');
    }
}

// Fungsi untuk memformat Rupiah
function formatRupiah(amount) {
    if (isNaN(amount) || amount === null) return 'Rp 0,00';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Fungsi untuk menampilkan bagian tertentu
function showSection(sectionId) {
    const sections = [dashboardSection, inputSection, laporanSection, adminSection];
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// Pendengar Acara Navigasi
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('dashboard-section');
    updateDashboard(); // Perbarui dashboard saat menavigasi ke sana
});

navInput.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('input-section');
});

navLaporan.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('laporan-section');
    populateReportFilters(); // Isi filter saat menavigasi ke laporan
    generateReport(); // Hasilkan laporan awal
});

navAdmin.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('admin-section');
    renderUserList(); // Perbarui daftar pengguna saat menavigasi ke panel admin
});

logoutButton.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('loggedInUser'); // Hapus sesi
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('login-message').textContent = '';
    console.log('User logged out.');
});

// Beban awal
document.addEventListener('DOMContentLoaded', async () => {
    await loadDB();
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        handleLoginSuccess(currentUser);
    }
});

// Isi pemilih SKPD/Unit di navigasi
function populateSKPDUnitSelector() {
    skpdUnitSelect.innerHTML = ''; // Hapus opsi yang ada

    if (currentUser.role === 'skpd' && db.unit_skpd[currentUser.skpd_id]) {
        // Tambahkan opsi untuk SKPD itu sendiri
        const skpdOption = document.createElement('option');
        skpdOption.value = currentUser.skpd_id;
        skpdOption.textContent = currentUser.skpd_id + " (Induk)";
        skpdUnitSelect.appendChild(skpdOption);

        // Tambahkan opsi untuk unitnya
        db.unit_skpd[currentUser.skpd_id].forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            skpdUnitSelect.appendChild(option);
        });
    } else if (currentUser.role === 'unit_skpd') {
        const option = document.createElement('option');
        option.value = currentUser.unit_id;
        option.textContent = currentUser.unit_id;
        skpdUnitSelect.appendChild(option);
        skpdUnitSelect.disabled = true; // Pengguna unit hanya dapat melihat unitnya sendiri
    }
    // Admin tidak menggunakan pemilih ini untuk pemfilteran, mereka menggunakan filter laporan
}

skpdUnitSelect.addEventListener('change', () => {
    updateDashboard();
    generateReport();
});

// Pembantu untuk visibilitas kata sandi
function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const showPasswordCheckbox = document.getElementById('show-password');
    const toggleIcon = document.querySelector('.toggle-password i');

    if (showPasswordCheckbox.checked) {
        passwordField.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}
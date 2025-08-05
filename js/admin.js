const createUserForm = document.getElementById('create-user-form');
const createUserMessage = document.getElementById('create-user-message');
const newUserRoleSelect = document.getElementById('new-role');
const adminSKPDSelectGroup = document.getElementById('admin-skpd-select-group');
const adminSKPDSelect = document.getElementById('admin-skpd-select');
const adminUnitSelectGroup = document.getElementById('admin-unit-select-group');
const adminUnitSelect = document.getElementById('admin-unit-select');
const userListTableBody = document.querySelector('#user-list-table tbody');

// Mengisi opsi SKPD dan Unit untuk pembuatan pengguna admin
function populateAdminSKPDAndUnitSelects() {
    adminSKPDSelect.innerHTML = '<option value="">Pilih SKPD</option>';
    db.skpd_list.forEach(skpd => {
        const option = document.createElement('option');
        option.value = skpd;
        option.textContent = skpd;
        adminSKPDSelect.appendChild(option);
    });
    adminUnitSelect.innerHTML = '<option value="">Pilih Unit SKPD</option>';
}

newUserRoleSelect.addEventListener('change', () => {
    if (newUserRoleSelect.value === 'skpd') {
        adminSKPDSelectGroup.style.display = 'block';
        adminUnitSelectGroup.style.display = 'none';
        populateAdminSKPDAndUnitSelects();
    } else if (newUserRoleSelect.value === 'unit_skpd') {
        adminSKPDSelectGroup.style.display = 'block';
        adminUnitSelectGroup.style.display = 'block';
        populateAdminSKPDAndUnitSelects();
    } else {
        adminSKPDSelectGroup.style.display = 'none';
        adminUnitSelectGroup.style.display = 'none';
    }
});

adminSKPDSelect.addEventListener('change', () => {
    adminUnitSelect.innerHTML = '<option value="">Pilih Unit SKPD</option>';
    const selectedSKPD = adminSKPDSelect.value;
    if (selectedSKPD && db.unit_skpd[selectedSKPD]) {
        db.unit_skpd[selectedSKPD].forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            adminUnitSelect.appendChild(option);
        });
    }
});

createUserForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (currentUser.role !== 'admin') {
        createUserMessage.textContent = 'Anda tidak memiliki izin untuk membuat pengguna.';
        createUserMessage.classList.add('error-message');
        return;
    }

    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;
    const newRole = newUserRoleSelect.value;
    const selectedSKPD = adminSKPDSelect.value;
    const selectedUnit = adminUnitSelect.value;

    if (db.users.some(u => u.username === newUsername)) {
        createUserMessage.textContent = 'Username sudah ada. Silakan pilih username lain.';
        createUserMessage.classList.add('error-message');
        createUserMessage.classList.remove('success-message');
        return;
    }

    const newUser = {
        id: 'USR' + Date.now(),
        username: newUsername,
        password: newPassword,
        role: newRole,
        skpd_id: null,
        unit_id: null
    };

    if (newRole === 'skpd' && selectedSKPD) {
        newUser.skpd_id = selectedSKPD;
    } else if (newRole === 'unit_skpd' && selectedSKPD && selectedUnit) {
        newUser.skpd_id = selectedSKPD;
        newUser.unit_id = selectedUnit;
    } else if (newRole !== 'admin') { 
        createUserMessage.textContent = 'Harap pilih SKPD dan/atau Unit SKPD untuk role ini.';
        createUserMessage.classList.add('error-message');
        createUserMessage.classList.remove('success-message');
        return;
    }

    db.users.push(newUser);
    saveDB();
    createUserMessage.textContent = 'User berhasil dibuat!';
    createUserMessage.classList.remove('error-message');
    createUserMessage.classList.add('success-message');
    createUserForm.reset();
    populateAdminSKPDAndUnitSelects(); 
    adminSKPDSelectGroup.style.display = 'none';
    adminUnitSelectGroup.style.display = 'none';
    renderUserList();
});

function renderUserList() {
    if (currentUser.role !== 'admin') {
        userListTableBody.innerHTML = '<tr><td colspan="5">Anda tidak memiliki izin untuk melihat daftar pengguna.</td></tr>';
        return;
    }

    userListTableBody.innerHTML = ''; // Hapus baris yang ada
    db.users.forEach(user => {
        if (user.role !== 'admin') {
            const row = userListTableBody.insertRow();
            row.insertCell().textContent = user.username;
            row.insertCell().textContent = user.role;
            row.insertCell().textContent = user.skpd_id || '-';
            row.insertCell().textContent = user.unit_id || '-';
            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.classList.add('delete-button');
            deleteButton.onclick = () => deleteUser(user.id);
            actionCell.appendChild(deleteButton);
        }
    });
}

function deleteUser(userId) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        return;
    }
    const initialUserCount = db.users.length;
    db.users = db.users.filter(user => user.id !== userId);
    if (db.users.length < initialUserCount) {
        saveDB();
        renderUserList();
        alert('User berhasil dihapus.');
    } else {
        alert('Gagal menghapus user.');
    }
}
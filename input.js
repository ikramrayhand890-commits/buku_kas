const transactionForm = document.getElementById('transaction-form');
const inputMessage = document.getElementById('input-message');

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!currentUser) {
        inputMessage.textContent = 'Silakan login terlebih dahulu.';
        inputMessage.classList.add('error-message');
        return;
    }

    const tanggal = document.getElementById('tanggal').value;
    const no_bukti = document.getElementById('no_bukti').value;
    const uraian = document.getElementById('uraian').value;
    const kredit = parseFloat(document.getElementById('Kredit').value);
    const debet = parseFloat(document.getElementById('Debet').value);

    if (isNaN(kredit) || isNaN(kredit) || kredit < 0 || kredit < 0) {
        inputMessage.textContent = 'Kredit dan Debet harus berupa angka positif.';
        inputMessage.classList.add('error-message');
        inputMessage.classList.remove('success-message');
        return;
    }

    if (kredit > 0 && debet > 0) {
        inputMessage.textContent = 'Transaksi tidak boleh memiliki Kredit dan Debet sekaligus.';
        inputMessage.classList.add('error-message');
        inputMessage.classList.remove('success-message');
        return;
    }
    if (kredit === 0 && debet === 0) {
        inputMessage.textContent = 'Transaksi harus memiliki Kredit atau Debet.';
        inputMessage.classList.add('error-message');
        inputMessage.classList.remove('success-message');
        return;
    }

    const newTransaction = {
        id_kas: 'TRX' + Date.now(), 
        tanggal: tanggal,
        no_bukti: no_bukti,
        uraian: uraian,
        kredit: kredit,
        debet: debet,
        skpd_id: currentUser.skpd_id,
        unit_id: currentUser.unit_id,
        user_id: currentUser.id
    };

    // Jika pengguna SKPD sedang memilih unit, terapkan unit tersebut ke transaksi
    if (currentUser.role === 'skpd' && skpdUnitSelect.value !== currentUser.skpd_id) {
        newTransaction.unit_id = skpdUnitSelect.value;
    } else if (currentUser.role === 'skpd' && skpdUnitSelect.value === currentUser.skpd_id) {
        newTransaction.unit_id = null; 
    } else if (currentUser.role === 'admin') {
        // Pengguna admin tidak dapat menginput transaksi secara langsung tanpa menetapkan SKPD/unit
        inputMessage.textContent = 'Admin tidak dapat menginput transaksi secara langsung. Silakan gunakan akun SKPD/Unit.';
        inputMessage.classList.add('error-message');
        inputMessage.classList.remove('success-message');
        return;
    }


    db.transactions.push(newTransaction);
    saveDB(); 

    inputMessage.textContent = 'Transaksi berhasil disimpan!';
    inputMessage.classList.remove('error-message');
    inputMessage.classList.add('success-message');
    transactionForm.reset();
    updateDashboard(); 
    generateReport(); 
});

// Tetapkan tanggal default ke hari ini
document.getElementById('tanggal').valueAsDate = new Date();
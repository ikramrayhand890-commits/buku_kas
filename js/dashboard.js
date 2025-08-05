const saldoAwalEl = document.getElementById('saldo-awal');
const totalKreditEl = document.getElementById('total-Kredit');
const totalDebetEl = document.getElementById('total-Debet');
const sisaSaldoEl = document.getElementById('sisa-saldo');
const setSaldoAwalBtn = document.getElementById('set-saldo-awal-btn');
const filterMonthEl = document.getElementById('filter-month');
const filterYearEl = document.getElementById('filter-year');
const applyFilterBtn = document.getElementById('apply-filter-btn');

function updateDashboard() {
    if (!currentUser) return;

    const selectedMonth = filterMonthEl.value;
    const selectedYear = filterYearEl.value;
    let currentSKPD = currentUser.skpd_id;
    let currentUnit = currentUser.unit_id;

    // Bagi pengguna SKPD, cek apakah unit tertentu sudah dipilih pada menu navigasi dropdown
    if (currentUser.role === 'skpd') {
        const navSelectedUnitOrSKPD = skpdUnitSelect.value;
        if (db.unit_skpd[currentUser.skpd_id] && db.unit_skpd[currentUser.skpd_id].includes(navSelectedUnitOrSKPD)) {
            currentUnit = navSelectedUnitOrSKPD;
            currentSKPD = currentUser.skpd_id; 
        } else {
            
            currentSKPD = navSelectedUnitOrSKPD;
            currentUnit = null; 
        }
    }

    let filteredTransactions = db.transactions.filter(t => {
        const transactionDate = new Date(t.tanggal);
        const transMonth = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
        const transYear = transactionDate.getFullYear().toString();

        const isMonthMatch = (selectedMonth === 'all' || transMonth === selectedMonth);
        const isYearMatch = (transYear === selectedYear);

        let isSKPDMatch = false;
        if (currentUser.role === 'admin') {
            // Admin dapat melihat semua atau memfilter berdasarkan laporan SKPD/Unit yang dipilih (ditangani di reports.js)
            // Untuk dashboard, admin melihat agregat jika tidak ada SKPD yang dipilih melalui filter laporan
            isSKPDMatch = true; // Dashboard admin biasanya menampilkan tampilan global kecuali ditentukan lain
        } else if (currentUser.role === 'skpd') {
            if (currentUnit) { // Jika suatu unit dipilih untuk pengguna SKPD
                isSKPDMatch = t.skpd_id === currentSKPD && t.unit_id === currentUnit;
            } else { // Jika SKPD sendiri yang dipilih (tampilkan semua untuk SKPD tersebut)
                isSKPDMatch = t.skpd_id === currentSKPD;
            }
        } else if (currentUser.role === 'unit_skpd') {
            isSKPDMatch = t.skpd_id === currentUser.skpd_id && t.unit_id === currentUser.unit_id;
        }
        return isMonthMatch && isYearMatch && isSKPDMatch;
    });

    let totalKredit = filteredTransactions.reduce((sum, t) => sum + t.kredit, 0);
    let totalDebet = filteredTransactions.reduce((sum, t) => sum + t.debet, 0);

    // Hitung Saldo Awal secara dinamis berdasarkan periode sebelumnya atau pengaturan eksplisit
    let currentSaldoAwal = 0;
    const saldoKey = `${currentSKPD}${currentUnit ? '_' + currentUnit : ''}_${selectedYear}-${selectedMonth}`;
    if (db.saldo_awal[saldoKey]) {
        currentSaldoAwal = db.saldo_awal[saldoKey];
    } else {
        // dapatkan saldo akhir dari bulan/tahun sebelumnya
        const prevDate = new Date(selectedYear, parseInt(selectedMonth) - 1, 1);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonth = (prevDate.getMonth() + 1).toString().padStart(2, '0');
        const prevYear = prevDate.getFullYear().toString();

        const prevSaldoKey = `${currentSKPD}${currentUnit ? '_' + currentUnit : ''}_${prevYear}-${prevMonth}`;
        if (db.saldo_awal[prevSaldoKey]) {
             currentSaldoAwal = db.saldo_awal[prevSaldoKey]; 
        } else {
            // Jika tidak ada saldo awal eksplisit untuk bulan berjalan, hitung dari transaksi hingga awal bulan ini
            let transactionsBeforeCurrentMonth = db.transactions.filter(t => {
                const transactionDate = new Date(t.tanggal);
                const transYear = transactionDate.getFullYear();
                const transMonth = transactionDate.getMonth() + 1; // 1-12

                const isSKPDMatch = (currentUser.role === 'admin' && t.skpd_id) || // Admin melihat semuanya
                                    (currentUser.role === 'skpd' && t.skpd_id === currentSKPD && (!currentUnit || t.unit_id === currentUnit)) ||
                                    (currentUser.role === 'unit_skpd' && t.skpd_id === currentUser.skpd_id && t.unit_id === currentUser.unit_id);

                return isSKPDMatch && (
                    transYear < parseInt(selectedYear) ||
                    (transYear === parseInt(selectedYear) && transMonth < parseInt(selectedMonth))
                );
            });
            currentSaldoAwal = transactionsBeforeCurrentMonth.reduce((sum, t) => sum + t.kredit - t.debet, 0);
        }
    }


    const sisaSaldo = currentSaldoAwal + totalKredit - totalDebet;

    saldoAwalEl.textContent = formatRupiah(currentSaldoAwal);
    totalKreditEl.textContent = formatRupiah(totalKredit);
    totalDebetEl.textContent = formatRupiah(totalDebet);
    sisaSaldoEl.textContent = formatRupiah(sisaSaldo);
}

setSaldoAwalBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const currentMonth = filterMonthEl.value;
    const currentYear = filterYearEl.value;
    let skpdId = currentUser.skpd_id;
    let unitId = currentUser.unit_id;

    if (currentUser.role === 'skpd') {
        const navSelectedUnitOrSKPD = skpdUnitSelect.value;
        if (db.unit_skpd[currentUser.skpd_id] && db.unit_skpd[currentUser.skpd_id].includes(navSelectedUnitOrSKPD)) {
            unitId = navSelectedUnitOrSKPD;
        } else {
            skpdId = navSelectedUnitOrSKPD;
            unitId = null; // Menetapkan saldo awal bagi SKPD itu sendiri
        }
    } else if (currentUser.role === 'admin') {
         alert("Admin tidak bisa mengatur saldo awal secara langsung. Silakan atur melalui akun SKPD/Unit.");
         return;
    }


    const newSaldo = prompt('Masukkan saldo awal untuk periode ini (misal: 1000000.00):');
    if (newSaldo !== null) {
        const amount = parseFloat(newSaldo);
        if (!isNaN(amount) && amount >= 0) {
            const saldoKey = `${skpdId}${unitId ? '_' + unitId : ''}_${currentYear}-${currentMonth}`;
            db.saldo_awal[saldoKey] = amount;
            saveDB();
            updateDashboard();
            alert('Saldo awal berhasil diatur!');
        } else {
            alert('Input tidak valid. Harap masukkan angka positif.');
        }
    }
});

applyFilterBtn.addEventListener('click', () => {
    updateDashboard();
});

// Tetapkan filter default ke bulan/tahun saat ini
const today = new Date();
filterMonthEl.value = (today.getMonth() + 1).toString().padStart(2, '0');
filterYearEl.value = today.getFullYear().toString();
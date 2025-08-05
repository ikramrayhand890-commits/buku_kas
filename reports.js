const transactionTableBody = document.querySelector('#transaction-table tbody');
const reportFilterSKPD = document.getElementById('report-filter-skpd');
const reportFilterUnit = document.getElementById('report-filter-unit');
const reportFilterMonth = document.getElementById('report-filter-month');
const reportFilterYear = document.getElementById('report-filter-year');
const generateReportBtn = document.getElementById('generate-report-btn');
const downloadExcelBtn = document.getElementById('download-excel');
const downloadPdfBtn = document.getElementById('download-pdf');
const downloadWordBtn = document.getElementById('download-word');

// Mengisi filter laporan berdasarkan peran pengguna
function populateReportFilters() {
    reportFilterSKPD.innerHTML = '<option value="all">Semua SKPD</option>';
    reportFilterUnit.innerHTML = '<option value="all">Semua Unit SKPD</option>';

    if (currentUser.role === 'admin') {
        db.skpd_list.forEach(skpd => {
            const option = document.createElement('option');
            option.value = skpd;
            option.textContent = skpd;
            reportFilterSKPD.appendChild(option);
        });
        document.getElementById('report-skpd-label').classList.remove('hidden');
        reportFilterSKPD.classList.remove('hidden');
        document.getElementById('report-unit-label').classList.remove('hidden');
        reportFilterUnit.classList.remove('hidden');
    } else if (currentUser.role === 'skpd') {
        const option = document.createElement('option');
        option.value = currentUser.skpd_id;
        option.textContent = currentUser.skpd_id + " (Induk)";
        reportFilterSKPD.appendChild(option);
        reportFilterSKPD.value = currentUser.skpd_id; 
        reportFilterSKPD.disabled = true; 

        if (db.unit_skpd[currentUser.skpd_id]) {
            db.unit_skpd[currentUser.skpd_id].forEach(unit => {
                const unitOption = document.createElement('option');
                unitOption.value = unit;
                unitOption.textContent = unit;
                reportFilterUnit.appendChild(unitOption);
            });
        }
        document.getElementById('report-skpd-label').classList.add('hidden'); 
        reportFilterSKPD.classList.add('hidden');
        document.getElementById('report-unit-label').classList.remove('hidden');
        reportFilterUnit.classList.remove('hidden');

    } else if (currentUser.role === 'unit_skpd') {
        const option = document.createElement('option');
        option.value = currentUser.skpd_id;
        option.textContent = currentUser.skpd_id;
        reportFilterSKPD.appendChild(option);
        reportFilterSKPD.value = currentUser.skpd_id;
        reportFilterSKPD.disabled = true;

        const unitOption = document.createElement('option');
        unitOption.value = currentUser.unit_id;
        unitOption.textContent = currentUser.unit_id;
        reportFilterUnit.appendChild(unitOption);
        reportFilterUnit.value = currentUser.unit_id;
        reportFilterUnit.disabled = true;
        document.getElementById('report-skpd-label').classList.add('hidden');
        reportFilterSKPD.classList.add('hidden');
        document.getElementById('report-unit-label').classList.add('hidden');
        reportFilterUnit.classList.add('hidden');
    }

    // Tetapkan filter default ke bulan/tahun saat ini
    const today = new Date();
    reportFilterMonth.value = (today.getMonth() + 1).toString().padStart(2, '0');
    reportFilterYear.value = today.getFullYear().toString();
}

reportFilterSKPD.addEventListener('change', () => {
    reportFilterUnit.innerHTML = '<option value="all">Semua Unit SKPD</option>';
    const selectedSKPD = reportFilterSKPD.value;
    if (selectedSKPD !== 'all' && db.unit_skpd[selectedSKPD]) {
        db.unit_skpd[selectedSKPD].forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            reportFilterUnit.appendChild(option);
        });
    }
});

generateReportBtn.addEventListener('click', generateReport);

function generateReport() {
    if (!currentUser) {
        transactionTableBody.innerHTML = '<tr><td colspan="7">Silakan login terlebih dahulu.</td></tr>';
        return;
    }

    let selectedSKPD = reportFilterSKPD.value;
    let selectedUnit = reportFilterUnit.value;
    const selectedMonth = reportFilterMonth.value;
    const selectedYear = reportFilterYear.value;

    // Terapkan filter khusus pengguna
    if (currentUser.role === 'skpd') {
        selectedSKPD = currentUser.skpd_id;
        if (selectedUnit === 'all') {
             selectedUnit = null; 
        }
    } else if (currentUser.role === 'unit_skpd') {
        selectedSKPD = currentUser.skpd_id;
        selectedUnit = currentUser.unit_id;
    }

    let filteredTransactions = db.transactions.filter(t => {
        const transactionDate = new Date(t.tanggal);
        const transMonth = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
        const transYear = transactionDate.getFullYear().toString();

        const isMonthMatch = (selectedMonth === 'all' || transMonth === selectedMonth);
        const isYearMatch = (transYear === selectedYear);

        let isSKPDMatch = true;
        if (selectedSKPD !== 'all') {
            isSKPDMatch = t.skpd_id === selectedSKPD;
        }

        let isUnitMatch = true;
        if (selectedUnit !== 'all' && selectedUnit !== null) {
             isUnitMatch = t.unit_id === selectedUnit;
        } else if (selectedUnit === null && t.unit_id) {
            isUnitMatch = false; 
        }


        return isMonthMatch && isYearMatch && isSKPDMatch && isUnitMatch;
    });

    // Urutkan transaksi berdasarkan tanggal
    filteredTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    transactionTableBody.innerHTML = ''; 

    let currentSaldo = 0;
    const saldoKey = `${selectedSKPD}${selectedUnit ? '_' + selectedUnit : ''}_${selectedYear}-${selectedMonth}`;
    if (db.saldo_awal[saldoKey]) {
        currentSaldo = db.saldo_awal[saldoKey];
    } else {
        // Hitung saldo awal untuk periode laporan jika tidak ditetapkan secara eksplisit
        let transactionsBeforeReportPeriod = db.transactions.filter(t => {
            const transactionDate = new Date(t.tanggal);
            const transYear = transactionDate.getFullYear();
            const transMonth = transactionDate.getMonth() + 1;

            let isRelevantSKPD = true;
            if (selectedSKPD !== 'all') {
                isRelevantSKPD = t.skpd_id === selectedSKPD;
            }

            let isRelevantUnit = true;
            if (selectedUnit !== 'all' && selectedUnit !== null) {
                isRelevantUnit = t.unit_id === selectedUnit;
            } else if (selectedUnit === null && t.unit_id) {
                isRelevantUnit = false;
            }

            return isRelevantSKPD && isRelevantUnit && (
                transYear < parseInt(selectedYear) ||
                (transYear === parseInt(selectedYear) && transMonth < parseInt(selectedMonth))
            );
        });
        currentSaldo = transactionsBeforeReportPeriod.reduce((sum, t) => sum + t.kredit - t.debet, 0);
    }

    // Tambahkan baris saldo awal
    const initialSaldoRow = transactionTableBody.insertRow();
    initialSaldoRow.insertCell().textContent = '---';
    initialSaldoRow.insertCell().textContent = '---';
    initialSaldoRow.insertCell().textContent = 'Saldo Awal';
    initialSaldoRow.insertCell().textContent = '';
    initialSaldoRow.insertCell().textContent = '';
    initialSaldoRow.insertCell().textContent = '';
    initialSaldoRow.insertCell().textContent = formatRupiah(currentSaldo);
    initialSaldoRow.style.fontWeight = 'bold';
    initialSaldoRow.style.backgroundColor = '#f0f8ff'; 

    if (filteredTransactions.length === 0) {
        const row = transactionTableBody.insertRow();
        row.insertCell().textContent = 'Tidak ada transaksi untuk periode ini.';
        row.cells[0].colSpan = 7;
        row.cells[0].style.textAlign = 'center';
        return;
    }

    filteredTransactions.forEach(transaction => {
        const row = transactionTableBody.insertRow();
        currentSaldo += transaction.kredit - transaction.debet;

        row.insertCell().textContent = transaction.tanggal;
        row.insertCell().textContent = transaction.no_bukti;
        row.insertCell().textContent = transaction.uraian;
        row.insertCell().textContent = formatRupiah(transaction.kredit);
        row.insertCell().textContent = formatRupiah(transaction.debet);
        row.insertCell().textContent = transaction.unit_id ? `${transaction.skpd_id} (${transaction.unit_id})` : transaction.skpd_id;
        row.insertCell().textContent = formatRupiah(currentSaldo);
    });

    // Tambahkan baris saldo akhir
    const finalSaldoRow = transactionTableBody.insertRow();
    finalSaldoRow.insertCell().textContent = '---';
    finalSaldoRow.insertCell().textContent = '---';
    finalSaldoRow.insertCell().textContent = 'Sisa Saldo Akhir';
    finalSaldoRow.insertCell().textContent = '';
    finalSaldoRow.insertCell().textContent = '';
    finalSaldoRow.insertCell().textContent = '';
    finalSaldoRow.insertCell().textContent = formatRupiah(currentSaldo);
    finalSaldoRow.style.fontWeight = 'bold';
    finalSaldoRow.style.backgroundColor = '#e0ffe0'; 
}

// Tetapkan tanggal default untuk filter laporan
const todayReport = new Date();
reportFilterMonth.value = (todayReport.getMonth() + 1).toString().padStart(2, '0');
reportFilterYear.value = todayReport.getFullYear().toString();


// --- Fungsi Unduhan ---

downloadExcelBtn.addEventListener('click', () => {
    const table = document.getElementById('transaction-table');
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    XLSX.writeFile(wb, "Laporan_Kas_Bendahara.xlsx");
});

downloadPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); 

    doc.autoTable({
        html: '#transaction-table',
        startY: 20,
        headStyles: { fillColor: [76, 175, 80] }, 
        styles: { fontSize: 8 },
        columnStyles: {
            3: { halign: 'right' }, 
            4: { halign: 'right' }, 
            6: { halign: 'right' }  
        },
        didDrawPage: function (data) {
            doc.text("Laporan Buku Kas Bendahara Kabupaten Donggala", data.settings.margin.left, 10);
        }
    });
    doc.save("Laporan_Kas_Bendahara.pdf");
});

downloadWordBtn.addEventListener('click', () => {
    const tableHtml = document.getElementById('transaction-table').outerHTML;
    const header = `<h1>Laporan Buku Kas Bendahara Kabupaten Donggala</h1>`;
    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #4CAF50;
                    color: white;
                }
                .saldo-awal-row {
                    font-weight: bold;
                    background-color: #f0f8ff;
                }
                .final-saldo-row {
                    font-weight: bold;
                    background-color: #e0ffe0;
                }
            </style>
        </head>
        <body>
            ${header}
            ${tableHtml}
        </body>
        </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Laporan_Kas_Bendahara.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

<?php
session_start();
include 'db/koneksi.php';

// Jika form login disubmit
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $skpd_id = $_POST['skpd_id'];

    $sql = "SELECT * FROM tb_user WHERE username='$username' AND password='$password' AND skpd_id='$skpd_id'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $_SESSION['user'] = $result->fetch_assoc();
        header("Location: dashboard.php"); // arahkan ke halaman utama
        exit();
    } else {
        $error = "Login gagal. Username, password, atau SKPD salah.";
    }
}
?>


<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Kas Bendahara Kabupaten Donggala</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>


<body>
    <div class="container login-container">
        <img src="img/logo_donggala.png" alt="Logo Donggala" class="logo">
    <div id="login-container" class="container">
        <h1 class="app-title"> Buku Kas Bendahara</h1>
        <h1 class="app-title"> Pemerintah Kabupaten Donggala</h1>
        <form id="login-form" method="POST" action="">
    <div class="input-group">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
    </div>
    <div class="input-group">
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        <span class="toggle-password" onclick="togglePasswordVisibility()"><i class="fas fa-eye"></i></span>
    </div>
    <div class="input-group checkbox-group">
        <input type="checkbox" id="show-password" onclick="togglePasswordVisibility()">
        <label for="show-password">Lihat Password</label>
    </div>
    <button type="submit">Login</button>
    <?php if (isset($error)) echo "<p class='error-message'>$error</p>"; ?>
</form>

    </div>
    </div>

    <div id="app-container" class="container hidden">
        <header>
            <h1>Dashboard Buku Kas Bendahara</h1>
            <div class="user-info">
                <span id="logged-in-user"></span>
                <button id="logout-button">Logout</button>
            </div>
        </header>

        <nav id="main-nav">
            <ul>
                <li><a href="#" id="nav-dashboard">Dashboard</a></li>
                <li><a href="#" id="nav-input">Input Transaksi</a></li>
                <li><a href="#" id="nav-laporan">Laporan</a></li>
                <li id="admin-menu" class="hidden"><a href="#" id="nav-admin">Admin Panel</a></li>
                <li id="skpd-unit-selector" class="hidden">
                    <label for="skpd-unit-select">Pilih Unit:</label>
                    <select id="skpd-unit-select"></select>
                </li>
            </ul>
        </nav>

        <main>
            <section id="dashboard-section" class="app-section">
                <h2>Dashboard</h2>
                <div class="dashboard-summary">
                    <div>
                        <h3>Saldo Awal</h3>
                        <p id="saldo-awal">Rp 0,00</p>
                        <button id="set-saldo-awal-btn">Set Saldo Awal</button>
                    </div>
                    <div>
                        <h3>Kredit</h3>
                        <p id="total-kredit">Rp 0,00</p>
                    </div>
                    <div>
                        <h3>Debet</h3>
                        <p id="total-debet">Rp 0,00</p>
                    </div>
                    <div>
                        <h3>Sisa Saldo</h3>
                        <p id="sisa-saldo">Rp 0,00</p>
                    </div>
                </div>
                <div class="filter-controls">
                    <label for="filter-month">Bulan:</label>
                    <select id="filter-month">
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                    <label for="filter-year">Tahun:</label>
                    <input type="number" id="filter-year" value="2025" min="2000" max="2100">
                    <button id="apply-filter-btn">Filter</button>
                </div>
            </section>

            <section id="input-section" class="app-section hidden">
                <h2>Input Transaksi Kas</h2>
                <form id="transaction-form">
                    <div class="input-group">
                        <label for="tanggal">Tanggal:</label>
                        <input type="date" id="tanggal" required>
                    </div>
                    <div class="input-group">
                        <label for="no_bukti">Nomor Jurnal / Bukti:</label>
                        <input type="text" id="no_bukti" required>
                    </div>
                    <div class="input-group">
                        <label for="uraian">Uraian:</label>
                        <input type="text" id="uraian" required>
                    </div>
                    <div class="input-group">
                        <label for="kredit">Kredit (Rp):</label>
                        <input type="number" id="kredit" step="0.01" value="0" required>
                    </div>
                    <div class="input-group">
                        <label for="debet">Debet (Rp):</label>
                        <input type="number" id="debet" step="0.01" value="0" required>
                    </div>
                    <button type="submit">Simpan Transaksi</button>
                    <p id="input-message" class="success-message"></p>
                </form>
            </section>

            <section id="laporan-section" class="app-section hidden">
                <h2>Laporan Transaksi Kas</h2>
                <div class="filter-controls">
                    <label for="report-filter-skpd" id="report-skpd-label" class="hidden">Pilih SKPD:</label>
                    <select id="report-filter-skpd" class="hidden"></select>
                    <label for="report-filter-unit" id="report-unit-label" class="hidden">Pilih Unit SKPD:</label>
                    <select id="report-filter-unit" class="hidden"></select>
                    <label for="report-filter-month">Bulan:</label>
                    <select id="report-filter-month">
                        <option value="all">Semua Bulan</option>
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                    <label for="report-filter-year">Tahun:</label>
                    <input type="number" id="report-filter-year" value="2025" min="2000" max="2100">
                    <button id="generate-report-btn">Tampilkan Laporan</button>
                </div>

                <div class="report-actions">
                    <button id="download-excel"><i class="fas fa-file-excel"></i> Unduh Excel</button>
                    <button id="download-pdf"><i class="fas fa-file-pdf"></i> Unduh PDF</button>
                    <button id="download-word"><i class="fas fa-file-word"></i> Unduh Word</button>
                </div>
                <div class="table-container">
                    <table id="transaction-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>No. Jurnal/Bukti</th>
                                <th>Uraian</th>
                                <th>Kredit</th>
                                <th>Debet</th>
                                <th>SKPD/Unit</th>
                                <th>Sisa Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            </tbody>
                    </table>
                </div>
            </section>

            <section id="admin-section" class="app-section hidden">
                <h2>Admin Panel</h2>
                <h3>Manajemen User</h3>
                <form id="create-user-form">
                    <div class="input-group">
                        <label for="new-username">Username:</label>
                        <input type="text" id="new-username" required>
                    </div>
                    <div class="input-group">
                        <label for="new-password">Password:</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="input-group">
                        <label for="new-role">Role:</label>
                        <select id="new-role" required>
                            <option value="">Pilih Role</option>
                            <option value="skpd">SKPD</option>
                            <option value="unit_skpd">Unit SKPD</option>
                        </select>
                    </div>
                    <div class="input-group" id="admin-skpd-select-group" style="display: none;">
                        <label for="admin-skpd-select">Pilih SKPD:</label>
                        <select id="admin-skpd-select"></select>
                    </div>
                    <div class="input-group" id="admin-unit-select-group" style="display: none;">
                        <label for="admin-unit-select">Pilih Unit SKPD:</label>
                        <select id="admin-unit-select"></select>
                    </div>
                    <button type="submit">Buat User Baru</button>
                    <p id="create-user-message" class="success-message"></p>
                </form>

                <h3>Daftar User</h3>
                <div class="table-container">
                    <table id="user-list-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>SKPD</th>
                                <th>Unit SKPD</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>

    <script src="js/main.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/dashboard.js"></script>
    <script src="js/input.js"></script>
    <script src="js/admin.js"></script>
    <script src="js/reports.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.3.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.14/jspdf.autotable.min.js"></script>
</body>

<footer class="footer">
    &copy; 2025 Pemerintah Kabupaten Donggala
    <h5>Ikram Rayhand</h5>
</footer>

</html>
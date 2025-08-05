<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "buku_kas"; // ✅ Harus SAMA persis seperti di phpMyAdmin

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>

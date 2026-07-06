/**
 * Google Apps Script untuk Sinkronisasi BukuKas
 * 
 * CARA MENGGUNAKAN:
 * 1. Buka Google Sheets (sheet baru kosong).
 * 2. Klik menu 'Extensions' -> 'Apps Script'.
 * 3. Hapus kode bawaan, lalu tempelkan (paste) seluruh kode di bawah ini.
 * 4. Klik tombol simpan (ikon disket).
 * 5. Klik tombol 'Deploy' -> 'New deployment'.
 * 6. Pilih tipe 'Web app' (ikon gerigi -> Web app).
 * 7. Konfigurasikan:
 *    - Description: BukuKas Sync API
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (PENTING! Agar aplikasi web bisa mengakses tanpa login akun Google Anda).
 * 8. Klik 'Deploy'. Setujui izin akses jika Google memintanya (klik Advanced -> Go to Untitled Project (unsafe)).
 * 9. Salin (copy) URL Web App yang diberikan, lalu tempelkan di menu Pengaturan BukuKas.
 */

const SHEET_NAME = "Transaksi";

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Tulis Header Kolom
    sheet.appendRow(["ID", "Tipe", "Nominal", "Tanggal", "Kategori", "Keterangan"]);
    // Hapus sheet bawaan jika kosong
    const sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() === 0) {
      ss.deleteSheet(sheet1);
    }
  }
  return sheet;
}

// Handler untuk membaca data (GET)
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    const data = [];
    
    // Lewati baris pertama (header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // Lewati jika ID kosong
      data.push({
        id: String(row[0]),
        type: String(row[1]),
        amount: Number(row[2]) || 0,
        date: formatDateString(row[3]),
        category: String(row[4]),
        description: String(row[5] || "")
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler untuk menulis/memperbarui data (POST)
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    
    // Bersihkan isi lembar kerja mulai dari baris kedua ke bawah
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Tulis data transaksi baru
    if (Array.isArray(postData) && postData.length > 0) {
      const rowsToWrite = postData.map(t => [
        t.id,
        t.type,
        t.amount,
        t.date,
        t.category,
        t.description || ""
      ]);
      
      sheet.getRange(2, 1, rowsToWrite.length, 6).setValues(rowsToWrite);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil disinkronkan ke cloud." }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Membantu merapikan format tanggal agar tidak terjadi timezone offset
function formatDateString(dateVal) {
  if (dateVal instanceof Date) {
    const yyyy = dateVal.getFullYear();
    const mm = String(dateVal.getMonth() + 1).padStart(2, '0');
    const dd = String(dateVal.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(dateVal);
}

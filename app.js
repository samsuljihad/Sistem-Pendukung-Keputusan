const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path'); // Pastikan path diimport
const mysql = require('mysql');
const app = express();
const port = 3000;

// Konfigurasi koneksi database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'SMP_NW'
});

// Connect ke database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to database');
});

// Setup EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// set up css
app.use(express.static(path.join(__dirname, 'public')));


// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/');
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // For demonstration purposes, we'll use a static username and password
  const user = 'admin';
  const pass = 'password';

  if (username === user && password === pass) {
    req.session.user = username;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid username or password');
  }
});
app.get('/alternatives/:nisn', (req, res) => {
  const { nisn } = req.params;
  const query = 'SELECT * FROM alternatives WHERE nisn = ?';
  db.query(query, [nisn], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    if (results.length > 0) {
      const alternative = results[0];
      res.json({ success: true, nama: alternative.nama, kelas: alternative.kelas });
    } else {
      res.json({ success: false, message: 'NISN tidak ditemukan.' });
    }
  });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM alternatives';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.render('dashboard', { user: req.session.user, alternatives: results });
  });
});
app.get('/alternatif', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM alternatives';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.render('alternatif', { user: req.session.user, alternatives: results });
  });
});

app.get('/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM alternatives WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      throw err;
    }
    if (results.length > 0) {
      res.render('edit', { alternative: results[0] });
    } else {
      res.redirect('/dashboard');
    }
  });
});

// Route to handle edit submission
app.post('/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { nisn, nama, kelas } = req.body;
  const query = 'UPDATE alternatives SET nisn = ?, nama = ?, kelas = ? WHERE id = ?';
  db.query(query, [nisn, nama, kelas, id], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/dashboard');
  });
});

// Route to handle delete
app.post('/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM alternatives WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/dashboard');
  });
});

app.get('/register', isAuthenticated, (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { nisn, nama, kelas } = req.body;
  const query = 'INSERT INTO alternatives (nisn, nama, kelas) VALUES (?, ?, ?)';
  db.query(query, [nisn, nama, kelas], (err, result) => {
    if (err) {
      throw err;
    }
    console.log('Data alternatif telah disimpan');
    res.redirect('/dashboard'); // Redirect ke halaman dashboard setelah pendaftaran berhasil
  });
});

// Kriteria routes
app.get('/kriteria', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM kriteria';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.render('kriteria', { kriteria: results });
  });
});

app.get('/kriteria/add', isAuthenticated, (req, res) => {
  res.render('addKriteria');
});

app.post('/kriteria/add', isAuthenticated, (req, res) => {
  const { nama_kriteria, bobot, type_kriteria } = req.body;
  const query = 'INSERT INTO kriteria (nama_kriteria, bobot, type_kriteria) VALUES (?, ?, ?)';
  db.query(query, [nama_kriteria, bobot, type_kriteria], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/kriteria');
  });
});

app.get('/kriteria/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM kriteria WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      throw err;
    }
    if (results.length > 0) {
      res.render('editKriteria', { kriteria: results[0] });
    } else {
      res.redirect('/kriteria');
    }
  });
});

app.post('/kriteria/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { nama_kriteria, bobot, type_kriteria } = req.body;
  const query = 'UPDATE kriteria SET nama_kriteria = ?, bobot = ?, type_kriteria = ? WHERE id = ?';
  db.query(query, [nama_kriteria, bobot, type_kriteria, id], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/kriteria');
  });
});

app.post('/kriteria/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM kriteria WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/kriteria');
  });
});

// Route penilaian
app.get('/hasil', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM penilaian ORDER BY score DESC';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.render('hasil', { penilaian: results });
  });
});
app.get('/penilaian', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM penilaian';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.render('penilaian', { penilaian: results });
  });
});

app.get('/penilaian/add', isAuthenticated, (req, res) => {
  res.render('addPenilaian');
});

app.post('/penilaian/add', isAuthenticated, (req, res) => {
  const { nisn, jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua } = req.body;

  const queryAlternatives = 'SELECT * FROM alternatives WHERE nisn = ?';
  db.query(queryAlternatives, [nisn], (err, resultsAlternatives) => {
    if (err) {
      throw err;
    }
    if (resultsAlternatives.length === 0) {
      res.send('<script>alert("NISN tidak ditemukan di data alternatif. Silakan tambah data alternatif baru."); window.location="/penilaian/add";</script>');
    } else {
      const alternative = resultsAlternatives[0];
      const queryPenilaian = 'SELECT * FROM penilaian WHERE nisn = ?';
      db.query(queryPenilaian, [nisn], (err, resultsPenilaian) => {
        if (err) {
          throw err;
        }
        if (resultsPenilaian.length > 0) {
          res.send('<script>alert("Data penilaian untuk NISN ini sudah ada. Tidak boleh duplikat."); window.location="/penilaian";</script>');
        } else {
          const score = calculateSAW(jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua);
          const queryInsert = 'INSERT INTO penilaian (nisn, nama, kelas, jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua, score) VALUES (?, ?, ?, ?, ?, ?, ?)';
          db.query(queryInsert, [alternative.nisn, alternative.nama, alternative.kelas, jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua, score], (err, result) => {
            if (err) {
              throw err;
            }
            res.redirect('/penilaian');
          });
        }
      });
    }
  });
});


app.post('/penilaian/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM penilaian WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      throw err;
    }
    res.redirect('/penilaian');
  });
});

// perhitungan saw
function calculateSAW(jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua) {
  // Normalisasi nilai
  const normJarak = jarak_rumah_sekolah / 100; // Asumsi jarak antara 0-100
  const normJumlah_Orang_Tua = jumlah_orang_tua / 4; // Asumsi nilai jumlah orang tua antara 0-10
  const normPenghasilanOrangTua = 1 / penghasilan_orang_tua; // Asumsi penghasilan antara 1-10 juta

  // Bobot kriteria
  const bobotjarak = 0.2;
  const bobotJumlahOrangTua = 0.3;
  const bobotPenghasilanOrangTua = 0.5;

  // Hitung skor akhir
  const score = (normJarak * bobotjarak) + (normJumlah_Orang_Tua * bobotJumlahOrangTua) + (normPenghasilanOrangTua * bobotPenghasilanOrangTua);

  return score;
}

// Route untuk menangani perhitungan skor
app.post('/penilaian/calculate', isAuthenticated, (req, res) => {
  const query = 'SELECT * FROM penilaian';
  db.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    results.forEach(item => {
      const { jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua } = item;
      const score = calculateSAW(jarak_rumah_sekolah, jumlah_orang_tua, penghasilan_orang_tua);
      const updateQuery = 'UPDATE penilaian SET score = ? WHERE id = ?';
      db.query(updateQuery, [score, item.id], (err, result) => {
        if (err) {
          throw err;
        }
      });
    });
    res.redirect('/penilaian');
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

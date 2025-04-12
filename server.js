const express = require('express');
require('dotenv').config();
const admin = require('firebase-admin');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

// Inizializza l'app di Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});


const db = admin.firestore();
const bucket = admin.storage().bucket();
const app = express();
const port = process.env.PORT || 3000;

// Middleware per il parsing del corpo delle richieste
app.use(express.json()); // per il parsing del corpo JSON
app.use(express.urlencoded({ extended: true })); // per il parsing del corpo di form data

// Configura multer per gestire l'upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite di 10MB per le immagini
});


// Configura CORS
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://lafornace.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
};

// Funzione per caricare le immagini su Firebase Storage
const uploadImageToFirebase = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file uploaded');
    }
    const blob = bucket.file(`images/${Date.now()}_${file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

// Rotte per il server
app.options('*', (req, res) => {
  setCorsHeaders(res);
  res.sendStatus(204);
});

app.get('/data', async (req, res) => {
  setCorsHeaders(res);
  try {
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.orderBy('giornata', 'asc').get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No articles found' });
    }

    let articles = [];
    snapshot.forEach(doc => {
      articles.push(doc.data());
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error('Error getting documents: ', error);
    res.status(500).json({ error: 'Error getting articles' });
  }
});

app.post('/upload', async (req, res) => {
  setCorsHeaders(res);
  const { password, ...data } = req.body;
  const correctPassword = process.env.PASSWORD;

  if (password !== correctPassword) {
    return res.status(401).json({ error: 'Password errata' });
  }

  try {
    await db.collection('articles').add(data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving document: ', error);
    res.status(500).json({ error: 'Error saving article' });
  }
});

app.post('/search', async (req, res) => {
  setCorsHeaders(res);
  const { query } = req.body;
  const lowerCaseQuery = query.toLowerCase();

  try {
    const articlesRef = db.collection('articles');
    const snapshot = await articlesRef.get();

    let results = [];
    snapshot.forEach(doc => {
      const article = doc.data();
      const titolo = article.titolo || '';
      const descrizione = article.descrizione || '';

      if (titolo.toLowerCase().includes(lowerCaseQuery) || descrizione.toLowerCase().includes(lowerCaseQuery)) {
        results.push(article);
      }
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching documents: ', error);
    res.status(500).json({ error: 'Error searching articles' });
  }
});

app.post('/prenota', async (req, res) => {
  setCorsHeaders(res);
  try {
    await db.collection('prenotazioni').add(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving document: ', error);
    res.status(500).json({ error: 'Error saving prenotation' });
  }
});

app.get('/prenotazioni', async (req, res) => {
  setCorsHeaders(res);
  try {
    const prenotationsRef = db.collection('prenotazioni');
    const snapshot = await prenotationsRef.get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No Prenotations Found' });
    }

    let prenotations = [];
    snapshot.forEach(doc => {
      prenotations.push(doc.data());
    });

    res.status(200).json(prenotations);
  } catch (error) {
    console.error('Error getting documents: ', error);
    res.status(500).json({ error: 'Error getting prenotations' });
  }
});

app.post('/uploadImage', upload.single('immagine'), async (req, res) => {
  setCorsHeaders(res);
  if (req.file) {
    try {
      const publicUrl = await uploadImageToFirebase(req.file);
      res.status(200).json({ imageUrl: publicUrl });
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      res.status(500).json({ error: 'Error saving image' });
    }
  } else {
    res.status(400).json({ error: 'No image uploaded' });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

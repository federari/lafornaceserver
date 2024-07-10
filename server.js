const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Configura Firebase Admin
const serviceAccount = require(path.join(__dirname, 'server-92e0a-firebase-adminsdk-a2ktf-ba78913c4e.json')); // Sostituisci con il percorso del tuo file di chiave JSON
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'server-92e0a' // Sostituisci con il tuo Project ID
});
const db = admin.firestore();

// Abilita CORS per tutte le richieste
app.use(cors());
app.use(express.json());

// Funzione per leggere gli articoli da Firestore
async function readArticles() {
    const articlesSnapshot = await db.collection('articoli').get();
    const articoli = [];
    articlesSnapshot.forEach(doc => {
        articoli.push(doc.data().articolo);
    });
    return articoli;
}

// Funzione per salvare un articolo su Firestore
async function saveArticle(articolo) {
    const docRef = db.collection('articoli').doc();
    await docRef.set({ articolo });
}

// Funzione per cancellare tutti gli articoli da Firestore
async function deleteAllArticles() {
    const articlesSnapshot = await db.collection('articoli').get();
    const batch = db.batch();
    articlesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

// API per ottenere gli articoli
app.get('/api/articoli', async (req, res) => {
    try {
        const articoli = await readArticles();
        res.json(articoli);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel leggere gli articoli.' });
    }
});

// API per aggiungere un articolo
app.post('/api/articoli', async (req, res) => {
    const { articolo } = req.body;
    if (!articolo) {
        return res.status(400).json({ error: 'Articolo mancante nel corpo della richiesta.' });
    }

    try {
        await saveArticle(articolo);
        res.json({ message: 'Articolo aggiunto con successo.' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel salvare l\'articolo.' });
    }
});

// API per cancellare tutti gli articoli
app.delete('/api/articoli', async (req, res) => {
    try {
        await deleteAllArticles();
        res.json({ message: 'Tutti gli articoli sono stati cancellati.' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel cancellare gli articoli.' });
    }
});

// Crea il server HTTP
const http = require('http');
const server = http.createServer(app);

// Avvio del server
server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

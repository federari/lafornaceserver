const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const http = require('http'); // Importa il modulo http

const app = express();
const PORT = process.env.PORT || 3000;

// Abilita CORS per tutte le richieste
app.use(cors({
    origin: 'https://lafornace.netlify.app'
}));

app.use(express.json());

// Percorso per il file JSON
const filePath = path.join(__dirname, 'data', 'articoli.json');

// API per ottenere gli articoli
app.get('/api/articoli', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel leggere gli articoli.' });
        }
        const articoli = JSON.parse(data);
        res.json(articoli);
    });
});

// API per aggiungere un articolo
app.post('/api/articoli', (req, res) => {
    const { articolo } = req.body;
    if (!articolo) {
        return res.status(400).json({ error: 'Articolo mancante nel corpo della richiesta.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel leggere gli articoli.' });
        }
        const articoli = JSON.parse(data);
        articoli.push(articolo);
        fs.writeFile(filePath, JSON.stringify(articoli), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel salvare l\'articolo.' });
            }
            res.json({ message: 'Articolo aggiunto con successo.' });
        });
    });
});

// API per cancellare tutti gli articoli
app.delete('/api/articoli', (req, res) => {
    fs.writeFile(filePath, JSON.stringify([]), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel cancellare gli articoli.' });
        }
        res.json({ message: 'Tutti gli articoli sono stati cancellati.' });
    });
});

// Crea il server HTTP
const server = http.createServer(app);

// Avvio del server
server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

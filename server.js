const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importa il pacchetto cors
const app = express();
const PORT = process.env.PORT || 2345;

// Abilita CORS per tutte le richieste
app.use(cors());

app.use(express.json());

const filePath = path.join(__dirname, 'data', 'articoli.json');

app.get('/api/articoli', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel leggere gli articoli.' });
        }
        const articoli = JSON.parse(data);
        res.json(articoli);
    });
});

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

app.delete('/api/articoli', (req, res) => {
    fs.writeFile(filePath, JSON.stringify([]), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel cancellare gli articoli.' });
        }
        res.json({ message: 'Tutti gli articoli sono stati cancellati.' });
    });
});

app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});

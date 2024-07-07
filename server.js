const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware per analizzare il corpo della richiesta come JSON
app.use(express.json());

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Route per ottenere gli articoli
app.get('/api/articoli', (req, res) => {
    fs.readFile(path.join(__dirname, 'data', 'articoli.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel leggere il file' });
        }
        const articoli = JSON.parse(data);
        res.json(articoli);
    });
});

// Route per aggiungere un nuovo articolo
app.post('/api/articoli', (req, res) => {
    const nuovoArticolo = req.body.articolo;
    if (!nuovoArticolo) {
        return res.status(400).json({ error: 'Nessun articolo fornito' });
    }

    fs.readFile(path.join(__dirname, 'data', 'articoli.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel leggere il file' });
        }
        const articoli = JSON.parse(data);
        articoli.push(nuovoArticolo);
        fs.writeFile(path.join(__dirname, 'data', 'articoli.json'), JSON.stringify(articoli, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel salvare l\'articolo' });
            }
            res.status(201).json({ message: 'Articolo aggiunto con successo' });
        });
    });
});

// Route per cancellare tutti gli articoli
app.delete('/api/articoli', (req, res) => {
    fs.writeFile(path.join(__dirname, 'data', 'articoli.json'), JSON.stringify([], null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel cancellare gli articoli' });
        }
        res.status(200).json({ message: 'Tutti gli articoli sono stati cancellati' });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

const http = require('http');
require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Inizializza l'app Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const port = process.env.PORT || 3000;

// Configura CORS
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
};

const requestHandler = async (req, res) => {
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/data' && req.method === 'GET') {
        setCorsHeaders(res);
        try {
            const articlesRef = db.collection('articles');
            const snapshot = await articlesRef.orderBy('giornata', 'asc').get();
            if (snapshot.empty) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No articles found' }));
                return;
            }

            let articles = [];
            snapshot.forEach(doc => {
                articles.push(doc.data());
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(articles));
        } catch (error) {
            console.error('Error getting documents: ', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error getting articles' }));
        }
    } else if (req.url === '/upload' && req.method === 'POST') {
        setCorsHeaders(res);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        console.log(body);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const correctPassword = process.env.PASSWORD;  // Questa dovrebbe essere gestita in modo più sicuro

                if (data.password !== correctPassword) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Password errata' }));
                    return;
                }

                delete data.password;  // Rimuovi la password dai dati salvati

                await db.collection('articles').add(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Error saving document: ', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error saving article' }));
            }
        });
    } else if (req.url === '/search' && req.method === 'POST') {
        setCorsHeaders(res);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const query = data.query.toLowerCase();
                console.log(`Received search query: ${query}`); // Log query
                const articlesRef = db.collection('articles');
                const snapshot = await articlesRef.get();

                let results = [];
                snapshot.forEach(doc => {
                    const article = doc.data();
                    const titolo = article.titolo || '';
                    const descrizione = article.descrizione || '';

                    if (titolo.toLowerCase().includes(query) || descrizione.toLowerCase().includes(query)) {
                        results.push(article);
                    }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                console.log(`Search results: ${JSON.stringify(results)}`); // Log results
                res.end(JSON.stringify(results));
            } catch (error) {
                console.error('Error searching documents: ', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error searching articles' }));
            }
        });
    } else if (req.url === '/prenota' && req.method === 'POST') {
        setCorsHeaders(res);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        console.log(body);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);

                await db.collection('prenotazioni').add(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error('Error saving document: ', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error saving prenotation' }));
            }
        });
    }else if (req.url === '/prenotazioni' && req.method === 'GET') {
        setCorsHeaders(res);
        try {
            const prenotationsRef = db.collection('prenotazioni');
            const snapshot2 = await prenotationsRef.get();
            if (snapshot2.empty) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No Prenotations Found' }));
                return;
            }

            let prenotations = [];
            snapshot2.forEach(doc => {
                prenotations.push(doc.data());
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(prenotations));
        } catch (error) {
            console.error('Error getting documents: ', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error getting prenotations' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
};

const server = http.createServer(requestHandler);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const http = require('http');
const admin = require('firebase-admin');
const path = require('path');

// Inizializza l'app Firebase
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const port = process.env.PORT || 3000;

// Configura CORS
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://lafornace.netlify.app');
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
            const snapshot = await articlesRef.get();
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
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
};

const server = http.createServer(requestHandler);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

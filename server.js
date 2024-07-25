require('dotenv').config();
const admin = require('firebase-admin');
const http = require('http');
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", error);
  process.exit(1);
}

const db = admin.firestore();

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/data') {
        db.collection('articoli').get()
            .then(snapshot => {
                const data = snapshot.docs.map(doc => doc.data());
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(data));
            })
            .catch(error => {
                res.statusCode = 500;
                res.end('Error getting documents: ' + error);
            });
    } else if (req.method === 'POST' && req.url === '/upload') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const data = JSON.parse(body);

            db.collection('articoli').add(data)
                .then(() => {
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(JSON.stringify({ success: true }));
                })
                .catch(error => {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: error.message }));
                });
        });
    } else {
        res.statusCode = 404;
        res.end();
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

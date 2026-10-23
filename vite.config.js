import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    {
      name: 'local-contact-api',
      configureServer(server) {
        server.middlewares.use('/api/contact', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const messageEntry = {
                  id: Date.now(),
                  timestamp: new Date().toISOString(),
                  name: data.name,
                  email: data.email,
                  subject: data.subject || 'Portfolio Inquiry',
                  message: data.message
                };

                const messagesFile = path.resolve(process.cwd(), 'messages.json');
                let existing = [];
                if (fs.existsSync(messagesFile)) {
                  try {
                    existing = JSON.parse(fs.readFileSync(messagesFile, 'utf-8'));
                  } catch (e) {
                    existing = [];
                  }
                }
                existing.unshift(messageEntry);
                fs.writeFileSync(messagesFile, JSON.stringify(existing, null, 2));

                console.log(`\n📩 [NEW PORTFOLIO MESSAGE RECEIVED] from ${data.name} (${data.email}):\n"${data.message}"\n`);

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: 'Message sent successfully!' }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ]
});

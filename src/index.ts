import fastify from 'fastify';
import fetch from 'node-fetch';
import { URL } from 'url';

const server = fastify();
const port = process.env.SERVER_PORT || 8080;
const host = process.env.SERVER_HOST || '0.0.0.0';
const allowedHostnamesString = process.env.ALLOWED_HOSTNAMES || 'ludovic-muller.fr';
const allowedHostnames = allowedHostnamesString.split(',').map((h) => h.trim());

const checkUrl = (url?: string) => {
  if (!url) {
    return {
      success: false,
      message: 'url parameter is required',
    };
  }

  const parsed = new URL(url);
  if (!allowedHostnames.includes(parsed.hostname)) {
    return {
      success: false,
      message: 'hostname is not allowed',
    };
  }

  return {
    success: true,
  };
};

// health check endpoint
server.get('/healthz', async () => 'OK\n');

server.get<{ Querystring: { url?: string } }>('/', async (request, response) => {
  const { url } = request.query;
  const urlValidation = checkUrl(url);
  if (!urlValidation.success) {
    return response.code(400).send(`${urlValidation.message}\n`);
  }

  const req = await fetch(`${url}`, { redirect: 'follow' });
  if (!req.ok) {
    return response.code(req.status).send(`${req.body}\n`);
  }

  return req.body;
});

server.listen(port, host, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

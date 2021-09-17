import { URL } from 'url';
import fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyRateLimit from 'fastify-rate-limit';
import fetch from 'node-fetch';

// get configuration from environment variables
const port = process.env.SERVER_PORT || 8080;
const host = process.env.SERVER_HOST || '0.0.0.0';
const rateLimitNumber = process.env.RATE_LIMIT_NUMBER || 60;
const rateLimitPeriod = process.env.RATE_LIMIT_PERIOD || '5 minutes';
const allowedHostnamesString = process.env.ALLOWED_HOSTNAMES || 'ludovic-muller.fr';
const allowedHostnames = allowedHostnamesString.split(',').map((h) => h.trim());

// initialize server and add some rate-limiting
const server = fastify();
server.register(fastifyCors);
server.register(fastifyRateLimit, {
  max: parseInt(`${rateLimitNumber}`, 10),
  timeWindow: rateLimitPeriod,
});

/**
 * Check if the URL is valid and if it can be proxied.
 *
 * @param url The URL to check.
 * @returns Informations about the URL.
 */
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

/**
 * Remove some headers.
 *
 * @param headers List of all headers.
 * @returns List of cleaned headers.
 */
const cleanHeaders = (headers?: Record<string, string>) => {
  if (!headers) {
    return headers;
  }

  return Object.fromEntries(Object.entries(headers).filter((e) => {
    const key = `${e[0]}`.toLocaleLowerCase();
    return !['host'].includes(key);
  }));
};

// health check endpoint
server.get('/healthz', async () => 'OK\n');

// support for GET requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
server.get<{ Querystring: { url?: string }, Headers: any }>('/', async (request, response) => {
  const { url } = request.query;
  const urlValidation = checkUrl(url);
  if (!urlValidation.success) {
    return response.code(400).send(`${urlValidation.message}\n`);
  }

  // do the request
  const req = await fetch(`${url}`, { redirect: 'follow', headers: cleanHeaders(request.headers) });
  if (!req.ok) {
    return response.code(req.status).send(req.body);
  }

  return req.body;
});

// support for POST requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
server.post<{ Querystring: { url?: string }, Body: any, Headers: any }>('/', async (request, response) => {
  const { url } = request.query;
  const urlValidation = checkUrl(url);
  if (!urlValidation.success) {
    return response.code(400).send(`${urlValidation.message}\n`);
  }

  // do the request
  const req = await fetch(`${url}`, {
    redirect: 'follow', method: 'POST', body: request.body, headers: cleanHeaders(request.headers),
  });
  if (!req.ok) {
    return response.code(req.status).send(req.body);
  }

  return req.body;
});

// start the server
server.listen(port, host, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

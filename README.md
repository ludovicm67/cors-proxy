# CORS proxy

## Configuration

You can configure the application using the following environment variables:

- `SERVER_PORT`: port this application should listen on (default: `8080`),
- `SERVER_HOST`: host this application should listen on (default: `0.0.0.0`),
- `RATE_LIMIT_NUMBER`: max number of allowed requests in a period of time (default: `60`),
- `RATE_LIMIT_PERIOD`: configure the period of time where requests should be counted (default: `5 minutes`),
- `ALLOWED_HOSTNAMES`: coma-separated list of allowed domains to proxy

## Security considerations

By default, this application has a rate limit which you can easily configure.
This is for preventing any spam.

It also contains a list of allowed domains.
This should be explicitly defined.
This prevents the make of untrusted requests to any other backend, which can be suspicious.

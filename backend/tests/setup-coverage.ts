/**
 * Coverage runs execute unit + integration tests together against the real
 * .env database. We only force NODE_ENV=test so the pino logger stays silent.
 */
process.env.NODE_ENV = 'test';

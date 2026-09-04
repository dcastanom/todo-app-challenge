import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('GET /metrics', () => {
  it('exposes Prometheus metrics including the default Node collectors', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('nodejs_eventloop_lag_seconds');
  });

  it('records HTTP request duration labelled by route pattern', async () => {
    await request(app).get('/health');
    await request(app).get('/api/v1/health');

    const res = await request(app).get('/metrics');
    expect(res.text).toContain('http_request_duration_seconds_bucket');
    expect(res.text).toMatch(/http_request_duration_seconds_count\{[^}]*method="GET"/);
    // The /metrics scrape itself is excluded from the histogram.
    expect(res.text).not.toMatch(/route="\/metrics"/);
  });
});

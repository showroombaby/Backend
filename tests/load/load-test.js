import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Montée à 50 utilisateurs sur 1 minute
    { duration: '3m', target: 50 }, // Maintien de 50 utilisateurs pendant 3 minutes
    { duration: '1m', target: 100 }, // Montée à 100 utilisateurs sur 1 minute
    { duration: '3m', target: 100 }, // Maintien de 100 utilisateurs pendant 3 minutes
    { duration: '1m', target: 0 }, // Retour à 0 sur 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes doivent être sous 500ms
    errors: ['rate<0.1'], // Taux d'erreur doit être inférieur à 10%
  },
};

const BASE_URL = 'http://localhost:3000';
let authToken;

export function setup() {
  // Login pour obtenir un token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'test@test.com',
    password: 'password123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  authToken = loginRes.json('token');
  return authToken;
}

export default function (authToken) {
  const params = {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Test des produits
  const productsRes = http.get(`${BASE_URL}/products`, params);
  check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test des notifications
  const notificationsRes = http.get(`${BASE_URL}/notifications`, params);
  check(notificationsRes, {
    'notifications status 200': (r) => r.status === 200,
    'notifications response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test de création de message
  const messagePayload = JSON.stringify({
    conversationId: '123',
    content: 'Test message',
  });

  const messageRes = http.post(`${BASE_URL}/messages`, messagePayload, params);

  check(messageRes, {
    'message creation successful': (r) => r.status === 201,
    'message creation time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // Test de recherche de produits
  const searchRes = http.get(
    `${BASE_URL}/products/search?q=test&page=1&limit=10`,
    params,
  );

  check(searchRes, {
    'search status 200': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);
}

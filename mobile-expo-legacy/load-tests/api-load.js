/**
 * k6 — squelette test de charge API EZOA-TO
 *
 * Usage:
 *   k6 run -e API_URL=http://localhost/zovu-project/backend-php load-tests/api-load.js
 *
 * Cible : 250k utilisateurs simulés (ajuster stages selon infra)
 */
import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = __ENV.API_URL || "http://localhost/zovu-project/backend-php";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 1000 },
    { duration: "10m", target: 5000 },
    // Montée progressive vers charge élevée — adapter à votre infra
    // { duration: "30m", target: 50000 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const res = http.get(`${API_URL}/epreuves?page=1&perPage=20`);

  check(res, {
    "status 200": (r) => r.status === 200,
    "has items": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.items);
      } catch {
        return false;
      }
    },
  });

  sleep(Math.random() * 2 + 0.5);
}

export function setup() {
  const meta = http.get(`${API_URL}/meta`);
  check(meta, { "meta ok": (r) => r.status === 200 });
  return { apiUrl: API_URL };
}

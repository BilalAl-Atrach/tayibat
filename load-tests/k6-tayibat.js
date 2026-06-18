import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "https://tayibatai.com";
const apiBaseUrl = __ENV.API_BASE_URL || `${baseUrl}/api/laravel`;
const authCookie = __ENV.AUTH_COOKIE || "";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
  scenarios: {
    public_pages: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "3m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      exec: "publicPages",
    },
    food_rules: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 25 },
        { duration: "3m", target: 25 },
        { duration: "1m", target: 0 },
      ],
      exec: "foodRules",
    },
    ai_chat: {
      executor: "constant-vus",
      vus: Number(__ENV.AI_VUS || 0),
      duration: "2m",
      exec: "aiChat",
    },
  },
};

export function publicPages() {
  for (const path of ["/", "/about", "/pricing", "/products", "/guidance"]) {
    const response = http.get(`${baseUrl}${path}`);
    check(response, {
      [`${path} ok`]: (res) => res.status >= 200 && res.status < 400,
    });
    sleep(0.5);
  }
}

export function foodRules() {
  const conditions = http.get(`${apiBaseUrl}/conditions`);
  check(conditions, {
    "conditions ok": (res) => res.status === 200,
  });

  const rules = http.get(`${apiBaseUrl}/rules/Healthy%20Diet`);
  check(rules, {
    "rules ok": (res) => res.status === 200 || res.status === 404,
  });

  sleep(1);
}

export function aiChat() {
  if (!authCookie) {
    return;
  }

  const response = http.post(
    `${baseUrl}/api/guidance-agent`,
    JSON.stringify({
      conditionName: "Healthy Diet",
      message: "Can I eat rice?",
      language: "en",
      chatHistory: [],
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
    }
  );

  check(response, {
    "ai responded": (res) => [200, 402].includes(res.status),
  });

  sleep(2);
}

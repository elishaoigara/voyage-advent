import test from "node:test";
import assert from "node:assert/strict";
import { assertOrigin } from "../lib/http";
test("CSRF accepts the browser Host behind Next internal URLs and rejects a foreign origin", () => {
  assert.doesNotThrow(() =>
    assertOrigin(
      new Request("http://127.0.0.1:3000/api/checkout", {
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    assertOrigin(
      new Request("http://internal:3000/api/checkout", {
        headers: {
          host: "voyage.example",
          origin: "https://voyage.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  );
  assert.throws(() =>
    assertOrigin(
      new Request("http://internal/api/checkout", {
        headers: {
          host: "voyage.example",
          origin: "https://evil.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  );
  assert.throws(() =>
    assertOrigin(
      new Request("http://internal/api/checkout", {
        headers: {
          host: "voyage.example",
          origin: "http://voyage.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  );
  assert.throws(() =>
    assertOrigin(new Request("http://localhost:3000/api/checkout")),
  );
});

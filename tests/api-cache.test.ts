import assert from "node:assert/strict";
import { test } from "node:test";
import { apiResource, invalidateRecords } from "../src/services/api-cache";

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
test("shared requests deduplicate and invalidation prevents stale writes from winning", async (t) => {
  const pending: ((response: Response) => void)[] = [];
  const calls = t.mock.method(
    globalThis,
    "fetch",
    () => new Promise<Response>((resolve) => pending.push(resolve)),
  );
  const first = apiResource("/doctors?cache-test");
  const second = apiResource("/doctors?cache-test");
  const unsubscribe = first.subscribe(() => {});
  t.after(() => {
    unsubscribe();
    invalidateRecords(false);
  });
  first.load();
  second.load();
  assert.equal(calls.mock.callCount(), 1);
  assert.equal(first.getSnapshot().loading, true);
  invalidateRecords();
  assert.equal(calls.mock.callCount(), 2);
  pending[1](new Response(JSON.stringify({ data: "new record" })));
  await settle();
  pending[0](new Response(JSON.stringify({ data: "old record" })));
  await settle();
  assert.deepEqual(second.getSnapshot().data, { data: "new record" });
  invalidateRecords(false);
  assert.equal(first.getSnapshot().data, undefined);
  assert.equal(calls.mock.callCount(), 2);
});

test("failed requests expose a retry and reload active resources", async (t) => {
  const fetch = t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ message: "Service unavailable" }), {
        status: 503,
      }),
  );
  const resource = apiResource("/patients?retry-test");
  const unsubscribe = resource.subscribe(() => {});
  t.after(() => {
    unsubscribe();
    invalidateRecords(false);
  });
  resource.load();
  await settle();
  assert.equal(resource.getSnapshot().error, "Service unavailable");
  assert.equal(resource.getSnapshot().loading, false);
  fetch.mock.mockImplementation(
    async () => new Response(JSON.stringify({ data: [] })),
  );
  resource.retry();
  await settle();
  assert.equal(resource.getSnapshot().error, "");
  assert.deepEqual(resource.getSnapshot().data, { data: [] });
});

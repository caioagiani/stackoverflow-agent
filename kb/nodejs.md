# Node.js — padrões recorrentes no SO

## My async function returns `undefined` or `Promise { <pending> }`
**Causa real:** The value is read before the promise settles.
**Resposta curta:** An async function always returns a promise. You cannot return a value out of the callback into the enclosing sync scope — you consume it inside `then`/`await`.
```js
const data = await getUser(id);   // inside another async function
// or
getUser(id).then(data => use(data));
```
**Armadilha:** Suggesting a "wait" loop, a callback flag, or `JSON.parse` around the promise. None of it works.
**Canônico:** https://stackoverflow.com/q/14220321

## `forEach` with an async callback does not wait
**Causa real:** `Array.prototype.forEach` ignores the returned promise.
**Resposta curta:** Use `for...of` for sequential work, `Promise.all` + `map` for parallel.
```js
for (const id of ids) await save(id);          // sequential
await Promise.all(ids.map(id => save(id)));    // parallel
```
**Armadilha:** `await` inside `forEach` looks right and silently completes early.

## Loop with `await` is very slow
**Causa real:** Each iteration waits for the previous one although the calls are independent.
**Resposta curta:** Fire the requests first, await the collection.
```js
const results = await Promise.all(urls.map(u => fetch(u)));
```
Use `Promise.allSettled` when one failure must not reject the rest. For rate limiting, chunk the array instead of going fully parallel.

## `Cannot use import statement outside a module` / `ERR_REQUIRE_ESM`
**Causa real:** CommonJS and ESM are being mixed.
**Resposta curta:** Pick one. For ESM, set `"type": "module"` in package.json and use `import` everywhere, or name the file `.mjs`. To load an ESM-only package from CommonJS, use dynamic import:
```js
const { default: fetch } = await import('node-fetch');
```
**Armadilha:** `require()` of an ESM-only package cannot be fixed with a transpiler flag alone.
**Canônico:** https://nodejs.org/api/esm.html

## `__dirname is not defined in ES module scope`
**Causa real:** `__dirname` and `__filename` only exist in CommonJS.
**Resposta curta:**
```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
```
On Node 20.11+ and 21.2+, `import.meta.dirname` works directly.

## `req.body` is `undefined` in Express
**Causa real:** No body parser registered, or the wrong one for the content type.
**Resposta curta:**
```js
app.use(express.json());                          // application/json
app.use(express.urlencoded({ extended: true }));  // form posts
```
Register it before the routes. For `multipart/form-data` neither works — use `multer`.
**Armadilha:** Installing `body-parser` separately is unnecessary since Express 4.16.

## `No 'Access-Control-Allow-Origin' header is present on the requested resource`
**Causa real:** The browser blocks a cross-origin response because the server did not opt in.
**Resposta curta:** Fix it on the server that is being called, not in the client.
```js
const cors = require('cors');
app.use(cors({ origin: 'https://app.example.com', credentials: true }));
```
**Armadilha:** `origin: '*'` together with `credentials: true` is rejected by the browser. A CORS error is also never fixed by changing the fetch `mode` to `no-cors` — that just hides the body.
**Canônico:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## `EADDRINUSE: address already in use :::3000`
**Causa real:** A previous process still holds the port.
**Resposta curta:**
```sh
lsof -i :3000       # macOS/Linux
kill -9 <pid>
```
On Windows: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`. If it happens on every reload, the server is being started twice — usually a watcher plus a manual start, or `listen()` called inside a module that gets imported more than once.

## `Cannot set headers after they are sent to the client`
**Causa real:** The handler responds twice.
**Resposta curta:** A route may send exactly one response. Add `return` before every send, and check for a missing `else`.
```js
if (!user) return res.status(404).json({ error: 'not found' });
res.json(user);
```
**Armadilha:** Also happens when `next()` is called after a response was already sent.

## `UnhandledPromiseRejection` crashes the process
**Causa real:** A rejected promise with no `catch`. Since Node 15 this terminates the process.
**Resposta curta:** Catch where the promise is created, and wrap async route handlers.
```js
app.get('/x', async (req, res, next) => {
  try { res.json(await load()); } catch (e) { next(e); }
});
```
**Armadilha:** A global `process.on('unhandledRejection')` hides the bug instead of fixing it — use it only to log and exit.

## `this` is `undefined` inside a method or callback
**Causa real:** The function lost its receiver when it was passed as a reference.
**Resposta curta:** Use an arrow function or bind.
```js
button.on('click', () => this.handle());   // arrow keeps outer this
this.handle = this.handle.bind(this);      // in the constructor
```
**Armadilha:** Arrow functions are wrong for object literal methods and for Mocha hooks, where `this` is supposed to be dynamic.
**Canônico:** https://stackoverflow.com/q/3127429

## `process.env.X` is `undefined`
**Causa real:** `.env` is never loaded, is loaded after the value is read, or sits in a different directory.
**Resposta curta:** Load it first, before any module that reads the variable.
```js
require('dotenv').config();   // very first line of the entry file
```
Node 20.6+ has it built in: `node --env-file=.env app.js`. `.env` is not read automatically in production — real environment variables come from the host.
**Armadilha:** Every value in `process.env` is a string. `process.env.DEBUG === true` is never true.

## `Cannot read properties of undefined (reading 'x')`
**Causa real:** The object is not there yet, or the shape differs from what is assumed.
**Resposta curta:** Log the parent value, not the property. In async code it is usually a missing `await`; in API responses it is usually one level of nesting off (`res.data.data`). Optional chaining silences the crash but does not fix the missing data:
```js
const name = res?.data?.user?.name;
```

## `npm ERR! ERESOLVE unable to resolve dependency tree`
**Causa real:** A package declares a peer dependency that conflicts with the installed version.
**Resposta curta:** Read which peer is conflicting, then either upgrade the offending package or install the required peer version. `--legacy-peer-deps` installs anyway and leaves a real version mismatch in place.
**Armadilha:** `--force` is not a fix; it is a decision to ship a broken tree.

## Module not found in production but works locally
**Causa real:** Case-sensitive filesystem on Linux, or a devDependency used at runtime.
**Resposta curta:** Check the import casing against the real filename (`./Utils/date` vs `./utils/date`) — macOS and Windows do not care, Linux does. Then check that the package is in `dependencies`, not `devDependencies`, since `npm ci --omit=dev` will not install the latter.

## `fs.readFile` gives me a Buffer, `JSON.parse` fails
**Causa real:** Without an encoding, `fs` returns raw bytes.
**Resposta curta:**
```js
const raw = await fs.promises.readFile('data.json', 'utf8');
const data = JSON.parse(raw);
```
For config files, `require('./data.json')` already parses. A BOM at the start of the file still breaks `JSON.parse` — strip `﻿` first.

## Date is off by one day / wrong timezone
**Causa real:** `new Date('2024-01-01')` parses as UTC midnight, then prints in local time.
**Resposta curta:** Date-only strings are UTC; date-time strings without a zone are local. Use an explicit form:
```js
new Date('2024-01-01T00:00:00-03:00');
```
Store UTC, convert at display time with `Intl.DateTimeFormat` and an explicit `timeZone`. Server-side, set `TZ=UTC` so local and production agree.
**Armadilha:** `getMonth()` is zero-based and `setDate` mutates the original object.

## Writing a large file in a loop uses all the memory
**Causa real:** The writes are queued faster than the stream can flush — backpressure is ignored.
**Resposta curta:** Respect the return value of `write`, or let `pipeline` do it.
```js
const { pipeline } = require('node:stream/promises');
await pipeline(source, transform, destination);
```
`pipeline` also destroys every stream on error, which manual `.pipe()` chains do not.
**Canônico:** https://nodejs.org/api/stream.html

## `MaxListenersExceededWarning: Possible EventEmitter memory leak detected`
**Causa real:** Listeners are attached inside a function that runs repeatedly and never removed.
**Resposta curta:** Attach once at setup, or remove on cleanup with `off`/`removeListener`. For one-shot events use `once`. Raising `setMaxListeners` hides the leak.

## `too many connections` / pool timeouts with pg or mysql
**Causa real:** A new client or pool is created per request, or connections are never released.
**Resposta curta:** One pool per process, created at startup, reused by every handler.
```js
const pool = new Pool({ max: 10 });
const { rows } = await pool.query('select 1');   // pool.query releases for you
```
With a manual `pool.connect()`, `client.release()` belongs in `finally`. In serverless, pool per container still multiplies by container count — use a proxy or a very small `max`.

## Mongoose query returns nothing / `buffering timed out after 10000ms`
**Causa real:** Queries run before the connection is established, or the collection name does not match.
**Resposta curta:** Await `mongoose.connect()` at startup before serving traffic. The timeout means no connection was ever made — check the URI, the IP allowlist and the credentials. An empty result with a working connection usually means Mongoose pluralized the collection name (`User` model reads `users`).

## `self signed certificate in certificate chain`
**Causa real:** The CA that signed the server certificate is not trusted by Node.
**Resposta curta:** Point Node at the CA bundle instead of disabling verification.
```sh
NODE_EXTRA_CA_CERTS=/path/to/ca.pem node app.js
```
**Armadilha:** `NODE_TLS_REJECT_UNAUTHORIZED=0` disables TLS validation process-wide and turns every request into a man-in-the-middle target. It is a local debugging step, never an answer for production.

## In-memory state breaks under PM2 cluster / multiple workers
**Causa real:** Each worker is a separate process with its own heap.
**Resposta curta:** Sessions, caches, rate-limit counters and socket.io rooms must live outside the process — Redis is the usual choice. Only one worker should run cron jobs or migrations (`process.env.NODE_APP_INSTANCE === '0'` with PM2).

## Callback hell / converting callbacks to promises
**Causa real:** A callback-style API is used inside async code.
**Resposta curta:**
```js
const { promisify } = require('node:util');
const sleep = promisify(setTimeout);
```
Most core modules already ship a promise version: `node:fs/promises`, `node:dns/promises`, `node:timers/promises`. Wrap third-party callbacks once with `new Promise((resolve, reject) => ...)` instead of nesting.

## `await is only valid in async functions` at the top level
**Causa real:** Top-level await only exists in ES modules.
**Resposta curta:** Switch the file to ESM (`"type": "module"`), or wrap the code in an async IIFE:
```js
(async () => { await main(); })();
```

## A required module is an empty object `{}`
**Causa real:** Circular require — A requires B while B is still requiring A.
**Resposta curta:** The partially filled `module.exports` is what the other file sees. Move the shared piece into a third module, or require lazily inside the function that uses it. Destructuring at the top of the file (`const { x } = require('./a')`) captures the empty value permanently.

## `npm ERR! code ELIFECYCLE` / script fails with no useful message
**Causa real:** The script itself exited non-zero; npm only reports the exit code.
**Resposta curta:** Run the underlying command directly to see the real error (`node build.js` instead of `npm run build`). The npm log file path printed at the end has the full output. Deleting `node_modules` and the lockfile is the last step, not the first.

## Path works on Windows, breaks on Linux
**Causa real:** Hardcoded separators or a path relative to the current working directory.
**Resposta curta:** Build paths from the module location, never from the cwd.
```js
const path = require('node:path');
const file = path.join(__dirname, 'data', 'users.json');
```
`./data/users.json` resolves against wherever the process was started, which is why it breaks under a service manager.

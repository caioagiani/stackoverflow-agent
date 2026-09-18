# PHP — recurring patterns on SO

## `Warning: Undefined variable $x` / `Undefined array key "x"`
**Root cause:** The variable or key was never set on this code path. In PHP 8 it is a warning, not a notice.
**Short answer:** Check before reading instead of suppressing.
```php
$name = $_POST['name'] ?? '';
```
For `$_POST`, an undefined key almost always means the form field name differs, the method is GET, or the form lacks `enctype="multipart/form-data"` while the code reads a file field.
**Gotcha:** `@` and lowering `error_reporting` hide the symptom and leave the wrong value in place.
**Canonical:** https://stackoverflow.com/q/12769982

## `Fatal error: Call to a member function x() on null`
**Root cause:** The expression before `->` returned `null` — usually a failed lookup whose result was never checked.
**Short answer:** Find what produced the null, do not chase the line that crashed.
```php
$user = $repo->find($id);
if ($user === null) { throw new RuntimeException("user $id not found"); }
$user->getName();
```
`?->` is only right when null is an expected, harmless case.

## `Warning: Cannot modify header information - headers already sent by ...`
**Root cause:** Output was flushed before `header()`, `setcookie()` or `session_start()`.
**Short answer:** The warning names the file and line that produced the output — fix there. The usual sources are a blank line or BOM before `<?php`, a stray `echo`, or whitespace after the closing `?>`. Omit the closing `?>` in pure PHP files.
**Canonical:** https://stackoverflow.com/q/8028957

## `isset` vs `empty` vs `??`
**Root cause:** They answer different questions.
**Short answer:** `isset` is false for unset and for `null`. `empty` is true for `''`, `0`, `'0'`, `[]`, `null`, `false`. `??` returns the right side when the left is unset or null.
```php
if (!empty($_POST['qty'])) { }   // rejects a legitimate 0
if (isset($_POST['qty'])) { }    // accepts 0
```
**Gotcha:** Validating numeric input with `empty` silently drops zero.

## `==` gives a result that makes no sense
**Root cause:** Loose comparison converts types before comparing.
**Short answer:** Use `===` unless there is a reason not to.
```php
var_dump("abc" == 0);   // false in PHP 8, true in PHP 7
var_dump("1e2" == "100"); // true, both look numeric
```
PHP 8 changed string-to-number comparison: the number is now cast to string when the string is non-numeric. Code that relied on PHP 7 behaviour breaks on upgrade.
**Canonical:** https://www.php.net/manual/en/language.operators.comparison.php

## SQL injection / building a query with string concatenation
**Root cause:** User input is being interpolated into SQL.
**Short answer:** Prepared statements with bound parameters, always.
```php
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
```
**Gotcha:** `mysqli_real_escape_string` plus quotes is not equivalent, and table or column names cannot be bound — those must be validated against an allowlist.
**Canonical:** https://stackoverflow.com/q/60174

## PDO query fails silently / returns `false`
**Root cause:** PDO defaults to silent mode on older configs, so errors never surface.
**Short answer:** Turn on exceptions when the connection is created.
```php
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
```
PHP 8.0+ uses exception mode by default, so a silent false usually means an old default or a caught-and-ignored exception.
**Canonical:** https://www.php.net/manual/en/pdo.prepared-statements.php

## `fetch()` returns `false` but the row exists
**Root cause:** `fetch` returns `false` when there are no more rows; `fetchAll` returns an empty array.
**Short answer:** A single row check is `if ($row = $stmt->fetch())`. If the row exists in a client but not here, the parameter type is usually the difference — with `EMULATE_PREPARES` off, a string `'5'` bound against an integer column still matches, but a trailing space or different collation does not.

## Accented characters turn into `Ã©` or `?`
**Root cause:** One of the layers is not UTF-8.
**Short answer:** Make all four agree: the database and column collation (`utf8mb4_unicode_ci`), the connection charset (`charset=utf8mb4` in the DSN), the response header (`header('Content-Type: text/html; charset=utf-8')`) and the file encoding itself (UTF-8 without BOM).
**Gotcha:** `utf8` in MySQL is a 3-byte subset that cannot store emoji — `utf8mb4` is the real one. Re-encoding with `utf8_encode` on top of already-correct data creates the double encoding people then ask about.
**Canonical:** https://stackoverflow.com/q/279170

## File upload fails or `$_FILES` is empty
**Root cause:** A size limit was exceeded, or the form is not multipart.
**Short answer:** Check `$_FILES['f']['error']` first — it has the reason. Then check `upload_max_filesize` and `post_max_size` in php.ini; when `post_max_size` is exceeded, both `$_POST` and `$_FILES` come back empty with no error at all.
```php
if ($_FILES['f']['error'] !== UPLOAD_ERR_OK) { /* handle */ }
move_uploaded_file($_FILES['f']['tmp_name'], $dest);
```
**Gotcha:** Trusting `$_FILES['f']['type']` or the original filename. Validate the real MIME type with `finfo` and generate your own filename.

## `$_SESSION` is empty after a redirect
**Root cause:** `session_start()` is missing on the second page, runs after output, or the cookie is not being sent back.
**Short answer:** `session_start()` must run on every page that touches the session, before any output. If the login page is `https://example.com` and the redirect goes to `https://www.example.com`, the cookie does not follow. Same for a `secure` cookie over plain HTTP, and for `SameSite=Strict` after an external redirect.

## `Fatal error: Uncaught Error: Class "App\Foo" not found`
**Root cause:** Autoloading does not map the namespace to the file.
**Short answer:** With PSR-4, directory structure and namespace must match exactly, including case, and the file must be named after the class.
```json
{ "autoload": { "psr-4": { "App\\": "src/" } } }
```
Run `composer dump-autoload` after changing the mapping, and confirm `require 'vendor/autoload.php'` is the first thing the entry point does.

## Built-in class not found inside a namespace
**Root cause:** Unqualified names resolve relative to the current namespace.
**Short answer:** Prefix global classes and constants with a backslash, or import them.
```php
namespace App;
$d = new \DateTime();
use DateTime;   // alternative, at the top of the file
```
Functions fall back to the global namespace, classes do not.

## `date()` shows the wrong hour
**Root cause:** The server timezone differs from the one being assumed.
**Short answer:** Set it explicitly and work with objects, not strings.
```php
date_default_timezone_set('America/Sao_Paulo');
$d = new DateTimeImmutable('now', new DateTimeZone('UTC'));
```
Store UTC in the database, convert on output. `DateTime` is mutable and `modify()` changes the original — `DateTimeImmutable` avoids a whole class of bugs.

## `0.1 + 0.2 != 0.3` / money rounding is wrong
**Root cause:** Binary floating point cannot represent these decimals exactly.
**Short answer:** Compare with a tolerance, and never store money as float. Use integer cents, `DECIMAL` columns, or bcmath.
```php
bcadd('0.1', '0.2', 2);   // "0.30"
```

## Array functions return something unexpected
**Root cause:** They differ on keys.
**Short answer:** `array_merge` renumbers integer keys, `+` keeps the left side and ignores duplicate keys. `array_filter` preserves the original keys, so a filtered list becomes a JSON object instead of an array — wrap it in `array_values`. `in_array` is loose by default; pass `true` as the third argument.
```php
echo json_encode(array_values(array_filter($rows)));
```

## `cURL error 60: SSL certificate problem: unable to get local issuer certificate`
**Root cause:** No CA bundle configured in php.ini.
**Short answer:** Download a CA bundle and point php.ini at it with `curl.cainfo` and `openssl.cafile`, then restart PHP.
**Gotcha:** `CURLOPT_SSL_VERIFYPEER => false` disables certificate checking entirely. It is a symptom of a missing CA bundle, not a fix.

## Blank white page, no error anywhere
**Root cause:** `display_errors` is off and a fatal error occurred.
**Short answer:** In development:
```php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);
```
In production, keep `display_errors` off and read the error log instead — `error_log` in php.ini says where it is. Setting these at the top of the script will not reveal a parse error in that same file; the log will.
**Canonical:** https://stackoverflow.com/q/1053424

## `Deprecated: Creation of dynamic property X::$y is deprecated`
**Root cause:** PHP 8.2 deprecates assigning to properties that were never declared.
**Short answer:** Declare the property on the class.
```php
class User { public ?string $email = null; }
```
`#[\AllowDynamicProperties]` exists for legacy classes that genuinely need it, but on new code the deprecation is pointing at a typo or a missing declaration.

## `json_decode` returns `null`
**Root cause:** The input is not valid JSON.
**Short answer:** Ask for the error.
```php
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
```
Common inputs: an HTML error page from a failed request, a PHP warning prepended to the body, a UTF-8 BOM, or single-quoted keys. `json_decode` also returns `null` for the literal input `"null"`, which `json_last_error` distinguishes.

## Storing passwords
**Root cause:** md5, sha1 and custom salting still show up in new code.
**Short answer:**
```php
$hash = password_hash($plain, PASSWORD_DEFAULT);
if (password_verify($plain, $hash)) { }
```
The column needs at least 255 characters. No separate salt column — it is inside the hash.

## Output shows raw HTML or breaks the page / XSS
**Root cause:** User data is echoed without escaping.
**Short answer:** Escape at the point of output, according to context.
```php
echo htmlspecialchars($comment, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
```
Escaping on input corrupts the stored data and still leaves other contexts (attributes, JS, URLs) unprotected.

## `include`/`require` path fails depending on where the script runs
**Root cause:** Relative includes resolve against the current working directory.
**Short answer:**
```php
require __DIR__ . '/../config/db.php';
```
`__DIR__` is the directory of the current file and never changes with the caller.

## Laravel: same query runs hundreds of times
**Root cause:** N+1 — a relation is accessed inside a loop without eager loading.
**Short answer:**
```php
$posts = Post::with('author')->get();
```
Enable `Model::preventLazyLoading()` in local development to catch it as an exception. `whereHas` filters; it does not load the relation.

## Laravel: `MassAssignmentException` / fields not saving
**Root cause:** The attributes are not in `$fillable`.
**Short answer:** Add only the columns users are allowed to set.
```php
protected $fillable = ['title', 'body'];
```
**Gotcha:** `protected $guarded = [];` makes every column mass-assignable, including `is_admin` and `id`.

## PHP 8 syntax people ask about
**Root cause:** Answers copied from PHP 5 era code.
**Short answer:** `match` is strict and returns a value, `switch` is loose and falls through. `?->` short-circuits the whole chain on null. Named arguments let optional parameters be skipped, and constructor promotion removes the assignment boilerplate.
```php
public function __construct(private readonly PDO $db) {}
$status = match(true) { $n < 0 => 'neg', $n === 0 => 'zero', default => 'pos' };
```

## Headers/cookies set but not applied
**Root cause:** The response was already sent, or the header was written after output started.
**Short answer:** `header()` must precede any byte of body. Confirm with `headers_sent($file, $line)`, which returns exactly where the output began. A redirect also needs to stop execution:
```php
header('Location: /login');
exit;
```

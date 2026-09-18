# Python — padrões recorrentes no SO

## `ModuleNotFoundError: No module named 'x'` after installing it
**Causa real:** `pip` installed into a different interpreter than the one running the script.
**Resposta curta:** Install through the interpreter itself.
```sh
python -m pip install requests
python -c "import sys; print(sys.executable)"
```
Compare that path with the one the IDE or the venv uses. Inside an activated venv, a bare `pip` can still point at the system Python if the venv was created with a different binary.

## A file named like a stdlib module breaks the import
**Causa real:** The local file shadows the real module because the script directory comes first on `sys.path`.
**Resposta curta:** Rename the file. `random.py`, `json.py`, `email.py`, `queue.py`, `types.py` next to the script will be imported instead of the standard library, and the leftover `__pycache__` keeps breaking things after the rename — delete it too.
**Armadilha:** The traceback points at the stdlib module, which sends people looking for a bug in Python itself.

## `IndentationError: unexpected indent` / `TabError: inconsistent use of tabs and spaces`
**Causa real:** Tabs and spaces are mixed in the same block.
**Resposta curta:** Use 4 spaces everywhere and let the editor show whitespace. `python -tt script.py` reports the exact conflict. Pasting code from a web page is the usual source.

## Default argument keeps values from the previous call
**Causa real:** Default arguments are evaluated once, at function definition.
**Resposta curta:**
```python
def add(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
```
Same applies to `{}`, `set()`, and anything mutable — including a `datetime.now()` default, which freezes at import time.
**Canônico:** https://stackoverflow.com/q/1132941

## Functions created in a loop all use the last value
**Causa real:** Closures capture the variable, not its value at creation time.
**Resposta curta:** Bind the value through a default argument.
```python
handlers = [lambda x, i=i: x + i for i in range(3)]
```
Same bug with `functools.partial` used correctly as the alternative. It shows up constantly with Tkinter `command=` and with callbacks registered in a loop.

## Changing one list changes another
**Causa real:** Assignment copies the reference, not the object.
**Resposta curta:**
```python
b = a[:]              # shallow copy
b = copy.deepcopy(a)  # nested structures
```
`[[0] * 3] * 3` creates three references to the same row — use `[[0] * 3 for _ in range(3)]`.
**Canônico:** https://stackoverflow.com/q/2612802

## `ImportError: cannot import name 'X' from partially initialized module (most likely due to a circular import)`
**Causa real:** Two modules import each other at module level.
**Resposta curta:** Move the shared piece into a third module, or import inside the function that needs it. For type hints only, use `if TYPE_CHECKING:` with a string annotation, which never executes the import at runtime.

## `attempted relative import with no known parent package`
**Causa real:** The file was run as a script, so it has no package context.
**Resposta curta:** Run it as a module from the project root.
```sh
python -m package.module
```
Relative imports (`from . import x`) only work when the file is imported as part of a package, not when executed directly.

## `if __name__ == "__main__":`
**Causa real:** Code at module level runs on import, not just on execution.
**Resposta curta:** `__name__` is `"__main__"` only when the file is the entry point. Anything that should not run when the module is imported — including `multiprocessing` spawn on Windows and macOS, which reimports the file in each child — belongs under that guard.
**Canônico:** https://stackoverflow.com/q/419163

## `UnicodeDecodeError: 'utf-8' codec can't decode byte 0x... in position N`
**Causa real:** The file is not UTF-8, usually cp1252/latin-1.
**Resposta curta:** Pass the real encoding.
```python
open('f.csv', encoding='latin-1')
```
For mixed or dirty data, `errors='replace'` keeps the read going and marks the bad bytes. Python 3.15 makes UTF-8 the default on every platform; before that, `open()` on Windows uses the locale encoding, which is why the same script works on Linux and fails there.

## `TypeError: a bytes-like object is required, not 'str'`
**Causa real:** Bytes and text are being mixed.
**Resposta curta:** Decode at the boundary and work with `str` inside.
```python
text = resp.read().decode('utf-8')
payload = text.encode('utf-8')     # only when writing back out
```
Sockets, `subprocess` without `text=True`, and files opened with `'rb'` all give bytes.

## `TypeError: '<' not supported between instances of 'str' and 'int'`
**Causa real:** `input()` always returns a string.
**Resposta curta:**
```python
age = int(input('age: '))
```
Wrap it in `try/except ValueError` when the input is not guaranteed numeric. The same mismatch comes out of `csv` and JSON keys, which are always strings.

## `except:` or `except Exception: pass` hides the real error
**Causa real:** The traceback is discarded.
**Resposta curta:** Catch the specific exception and log it.
```python
try:
    do()
except (OSError, ValueError) as e:
    logging.exception("do() failed")
    raise
```
A bare `except:` also swallows `KeyboardInterrupt` and `SystemExit`.

## Threads do not make CPU-bound code faster
**Causa real:** The GIL lets only one thread execute bytecode at a time.
**Resposta curta:** Threads help with I/O waits; processes help with CPU work.
```python
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor() as ex:
    results = list(ex.map(crunch, items))
```
Free-threaded builds (3.13+, opt-in) change this, but the default interpreter still behaves as described.

## `coroutine 'main' was never awaited` / async code runs synchronously
**Causa real:** Calling a coroutine does not run it, and a blocking call inside `async def` blocks the whole loop.
**Resposta curta:**
```python
asyncio.run(main())
await asyncio.gather(*[fetch(u) for u in urls])
```
`requests`, `time.sleep`, and any DB driver that is not async will freeze the event loop — use the async equivalent, or `asyncio.to_thread(blocking_call)`.
**Canônico:** https://docs.python.org/3/library/asyncio.html

## `SettingWithCopyWarning: A value is trying to be set on a copy of a slice from a DataFrame`
**Causa real:** Chained indexing — pandas cannot tell whether it has a view or a copy.
**Resposta curta:** One indexing operation, with `.loc`.
```python
df.loc[df['age'] > 30, 'group'] = 'senior'
```
Chained `df[df.age > 30]['group'] = ...` may silently write to a temporary. With copy-on-write (pandas 3.0 default) it never writes back at all.
**Canônico:** https://pandas.pydata.org/docs/user_guide/indexing.html

## `merge` produces NaN or duplicates rows
**Causa real:** Key dtypes differ, keys have whitespace, or the right side is not unique.
**Resposta curta:** Check both sides before merging: `df['id'].dtype` on each, and `df_right['id'].duplicated().any()`. An `int64` key does not match an `object` key holding `'123'`. Pass `validate='1:1'` or `'m:1'` so pandas raises instead of silently fanning out rows, and `indicator=True` to see which side failed to match.

## `requests` hangs forever
**Causa real:** No timeout — the default is none.
**Resposta curta:**
```python
requests.get(url, timeout=(5, 30))   # connect, read
```
For repeated calls to the same host, reuse a `Session` so the connection is pooled.

## `requests.exceptions.SSLError: certificate verify failed`
**Causa real:** The CA chain is not trusted by the local certifi bundle, often a corporate proxy.
**Resposta curta:** Point at the corporate CA file.
```python
requests.get(url, verify='/path/to/corp-ca.pem')
```
**Armadilha:** `verify=False` disables validation completely and only silences the warning about it.

## `TypeError: can't subtract offset-naive and offset-aware datetimes`
**Causa real:** One datetime has a timezone and the other does not.
**Resposta curta:** Keep everything aware and in UTC.
```python
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
```
`datetime.utcnow()` returns a naive object that looks like UTC and is deprecated since 3.12 — that mismatch is the usual cause.

## `0.1 + 0.2 == 0.3` is False
**Causa real:** Binary floating point.
**Resposta curta:** Compare with a tolerance, or use `Decimal` for money.
```python
math.isclose(a, b)
Decimal('0.1') + Decimal('0.2')   # Decimal('0.3')
```
`Decimal(0.1)` from a float carries the error in — always construct from a string.
**Canônico:** https://stackoverflow.com/q/588004

## A generator is empty the second time it is used
**Causa real:** Generators, `map`, `filter` and `zip` are consumed once.
**Resposta curta:** Materialize it if it must be reused.
```python
rows = list(reader)
```
Printing a generator to debug it also consumes it.

## Removing items while iterating skips elements
**Causa real:** The list shifts under the loop.
**Resposta curta:** Build a new list instead.
```python
items = [x for x in items if keep(x)]
```
For dicts, iterate over `list(d.keys())` when keys are being deleted.

## `None` comes back from a function that should return a value
**Causa real:** The function prints instead of returning, or a branch has no `return`.
**Resposta curta:** `print` shows a value, `return` hands it back. Also: `list.sort()`, `append`, `reverse` and `shuffle` mutate in place and return `None` — `x = my_list.sort()` sets `x` to None. Use `sorted()` when a value is needed.

## `SyntaxWarning: "is" with a literal`
**Causa real:** `is` compares identity, not value.
**Resposta curta:** Use `==` for values, `is` only for `None`, `True`, `False` and sentinels.
```python
if x == 5:        # value
if x is None:     # identity
```
Small integers and short strings are cached, so `is` appears to work until the value grows.

## `KeyError: 'x'`
**Causa real:** The key is absent, sometimes because of case or whitespace.
**Resposta curta:**
```python
value = d.get('x', default)
```
`print(list(d))` shows what the keys actually are; JSON APIs frequently nest one level deeper than assumed. Use `collections.defaultdict` when every missing key should produce an empty container.

## `x: int = None` in a type hint
**Causa real:** `None` is not an `int`.
**Resposta curta:**
```python
def f(x: int | None = None) -> str: ...
```
`Optional[int]` is the same thing on older versions. `int | None` requires 3.10+, or `from __future__ import annotations`.

## Dict ordering and sorting
**Causa real:** Confusion about what is guaranteed.
**Resposta curta:** Dicts keep insertion order since 3.7. Sorting produces a new dict:
```python
dict(sorted(d.items(), key=lambda kv: kv[1], reverse=True))
```
Sets have no order at all, and their iteration order can change between runs for strings.

## f-strings, `format`, and `%`
**Causa real:** Old answers still teach `%`.
**Resposta curta:** f-strings for literals, `format` when the template is stored elsewhere, `%`-style only in logging calls so the formatting is skipped when the level is off.
```python
f"{value:.2f}"
logging.info("user %s failed", user_id)
```
f-strings evaluate at definition, so they cannot be used as a reusable template.

## `IndexError: list index out of range`
**Causa real:** The list is shorter than assumed, often empty.
**Resposta curta:** Check the length before indexing, and print the list itself — an empty result from a query or a failed split is the usual source. Iterate directly instead of indexing by `range(len(x))`, and use `enumerate` when the index is also needed.

<h1 align="center">Cliffy ❯ KeyCode </h1>

<p align="center">
  <a href="https://github.com/c4spar/deno-cliffy/releases">
    <img alt="Version" src="https://img.shields.io/github/v/release/c4spar/deno-cliffy?logo=github" />
  </a>
  <a href="https://github.com/c4spar/deno-cliffy/releases">
    <img alt="Release date" src="https://img.shields.io/github/release-date/c4spar/deno-cliffy?logo=github&color=blue" />
  </a>
  <a href="https://deno.land/">
    <img alt="Deno version" src="https://img.shields.io/badge/deno-^1.2.0-blue?logo=deno" />
  </a>
  <a href="https://github.com/c4spar/deno-cliffy/actions?query=workflow%3Aci">
    <img alt="Build status" src="https://github.com/c4spar/deno-cliffy/workflows/Test/badge.svg?branch=master" />
  </a>
  <a href="https://github.com/c4spar/deno-cliffy/labels/module%3Akeycode">
    <img alt="issues" src="https://img.shields.io/github/issues/c4spar/deno-cliffy/module:keycode?label=issues&logo=github">
  </a>
  <a href="https://github.com/c4spar/deno-cliffy/actions?query=workflow%3Aci">
    <img alt="Licence" src="https://img.shields.io/github/license/c4spar/deno-cliffy?logo=github" />
  </a>
</p>

<p align="center">
  <b>ANSI key code parser for <a href="https://deno.land/">Deno</a></b></br>
  <sub>>_ Used by cliffy's <a href="../prompt/">prompt</a> module.</sub>
</p>

## ❯ Content

- [Install](#-install)
- [Usage](#-usage)
- [API](#-api)
    - [KeyCode](#keycode)
    - [KeyEvent](#keyevent)
- [Contributing](#-contributing)
- [License](#-license)

## ❯ Install

This module can be imported directly from the repo and from following registries.

Deno Registry

```typescript
import { KeyCode } from "https://deno.land/x/cliffy@<version>/keycode/mod.ts";
```

Nest Registry

```typescript
import { KeyCode } from "https://x.nest.land/cliffy@<version>/keycode/mod.ts";
```

Github

```typescript
import { KeyCode } from "https://raw.githubusercontent.com/c4spar/deno-cliffy/<version>/keycode/mod.ts";
```

## ❯ Usage

```typescript
import { KeyCode } from "https://deno.land/x/cliffy/keycode/mod.ts";

async function read(): Promise<void> {
  const buffer = new Uint8Array(8);

  Deno.setRaw(Deno.stdin.rid, true);
  const nread = await Deno.stdin.read(buffer);
  Deno.setRaw(Deno.stdin.rid, false);

  if (nread === null) {
    return;
  }

  const data = buffer.subarray(0, nread);

  const [event] = KeyCode.parse(data);

  if (event?.name === "c" && event.ctrl) {
    console.log("exit");
    return;
  }

  console.log(event);

  await read();
}

console.log("Hit ctrl + c to exit.");

await read();
```

```
$ deno run --unstable https://deno.land/x/cliffy/examples/keycode/read_key.ts
```

## ❯ API

### KeyCode

* parse( data: Uint8Array | string ): KeyEvent | undefined

### KeyEvent

* name?: string
* sequence?: string
* ctrl: boolean
* meta: boolean
* shift: boolean

## ❯ Contributing

Any kind of contribution is welcome! Please take a look at the [contributing guidelines](../CONTRIBUTING.md).

## ❯ License

[MIT](../../LICENSE)

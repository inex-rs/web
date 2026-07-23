# inex web

The inex website and firmware-registry browser — a SolidJS SPA talking
ConnectRPC to the `saros` API, built with Vite under Deno and deployed to Fly as
an nginx image.

```shell
deno task dev     # dev server (expects saros on :7171)
deno task build   # → dist/
deno task ci      # fmt · lint · check · build
```

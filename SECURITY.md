# Security

## Supported Use

This repository is a local POC. It is designed for local development and demos, not direct public internet exposure.

## Default Safety Controls

- n8n Code nodes cannot read arbitrary environment variables.
- n8n file access is restricted to `/files`.
- The renderer validates render payloads with Zod before rendering.
- Renderer request bodies are capped with `RENDERER_MAX_BODY_BYTES`.
- Renderer bearer auth can be enabled with `RENDERER_AUTH_TOKEN`.
- YouTube upload is disabled unless `YOUTUBE_UPLOAD_ENABLED=true`.
- `.env`, render artifacts, binary data, and `node_modules` are ignored.

## Local Checks

```bash
npm run check
npm run security
```

`npm run check` runs TypeScript, question validation, workflow validation, unit tests, and the static security scan.

`npm run security` also runs `npm audit --audit-level=high`.

Coverage is enforced with:

```bash
npm run coverage
```

The CI workflow writes the coverage table to the GitHub Actions job summary and uploads it as a build artifact.

## Reporting

For a public fork, open a private security advisory or contact the repository owner before publishing exploit details.

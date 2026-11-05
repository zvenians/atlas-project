# ATLAS

A logistics command-center interface by Kevin Oloan Simatupang.

## Current status

This repository currently contains a static `index.html` application, a `vercel.json` deployment configuration, and documentation. The interface can be inspected directly in a browser. Do not assume that displayed operational data represents a connected live logistics backend.

An [ATLAS v2.1 development pull request](https://github.com/zvenians/atlas-project/pull/1) proposes simulation and shipment foundations. Those changes are not part of the default branch until reviewed and merged.

## Run locally

Open `index.html` in a modern browser. For a local HTTP preview, from the repository root run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Python is needed only for this optional preview method.

## Repository layout

- `index.html` — interface markup, styles, and client-side behavior.
- `vercel.json` — deployment configuration.
- `docs/QUALITY_STANDARDS.md` — documentation and interface review criteria (on the quality-standards branch).

## Scope and verification

This README documents the files currently on the default branch; it does not certify production integrations, security controls, automated tests, or live data accuracy. Review the interface and browser console when evaluating changes.

© Kevin Oloan Simatupang. Third-party assets and dependencies retain their respective terms.

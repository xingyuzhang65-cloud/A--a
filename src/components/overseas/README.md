These components were ported from the local reference served at
`http://127.0.0.1:4226/tiantu-next-copy/v2/?v=instruction-tracking-20261020` on 2026-10-21.
The served `index-DPh5xekX.js` matched the reference source project's build
(SHA-256 `919b4380cd09e3064a3dd1df82d1af3845e03a9133f7b0b4b63eb4e5d1ba3cb3`).

`OverseasPage` integrates the pages with the existing ANSU navigation and heading.
`theme.css` preserves the host's purple accents and rounded cards.
The fee catalog reads the existing instruction management settings.
`instructionListState.ts` connects new inventory orders with the list and persists workflow changes.
Storage keys use an ANSU namespace; the previous page data is retained under its original keys.

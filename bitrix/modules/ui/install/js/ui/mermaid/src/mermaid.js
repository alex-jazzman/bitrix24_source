import mermaidApi from './mermaid.bundle.mjs';

// Vendored mermaid library, exposed under BX.UI.Mermaid (mirrors BX.UI.Pdfjs).
//
// mermaid.bundle.mjs is a single self-contained ESM build of the full
// `mermaid` package (all diagram types, no dynamic-import chunks), produced from
// node_modules with esbuild — see README.md for the regen command. The pre-bundle
// step is needed because chef emits an IIFE, which cannot code-split mermaid's
// lazily-imported diagram modules.
//
// Rendering runs in the parent frame and yields static SVG, so the markdown viewer
// can inject diagrams into its no-scripts sandboxed iframe.
export const mermaid = mermaidApi;

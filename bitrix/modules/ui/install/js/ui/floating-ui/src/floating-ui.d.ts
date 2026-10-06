// Type aggregate named after the runtime entry: the TS resolver picks it up next to
// src/floating-ui.js via aliases, giving consumers the official @floating-ui/dom types.
// src/vendor-types/ is refreshed on build by rollup-plugin-import-dts.js.
export * from './vendor-types/dom';

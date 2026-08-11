let _primary = null;
let _legacy = null;

export function setPrimary(engine) { _primary = engine; }
export function getPrimary() { return _primary; }

export function setLegacy(engine) { _legacy = engine; }
export function getLegacy() { return _legacy; }
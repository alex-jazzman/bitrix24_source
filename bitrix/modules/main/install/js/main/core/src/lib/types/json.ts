export type JsonValue = string | number | boolean | { [x: string]: JsonValue } | Array<JsonValue>;
export type JsonObject = Record<string, JsonValue>;

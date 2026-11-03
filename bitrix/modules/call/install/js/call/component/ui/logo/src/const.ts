export const CallLogoLanguages = new Set(['ru', 'en'] as const);

export type CallLogoLanguage = typeof CallLogoLanguages extends Set<infer T> ? T : never;

export const CallLogoColors = new Set([null, 'white'] as const);

export type CallLogoColor = typeof CallLogoColors extends Set<infer T> ? T : never;

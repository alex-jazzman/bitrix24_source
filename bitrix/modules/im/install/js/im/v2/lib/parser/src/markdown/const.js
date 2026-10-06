export const NEW_LINE = '\n';

export const MARKDOWN_PLACEHOLDER_SUFFIX = '####';
export const MARKDOWN_CODE_PREFIX = '####MD_CODE_';
export const MARKDOWN_ESCAPE_PREFIX = '####MD_ESC_';
export const MARKDOWN_INLINE_CODE_PREFIX = '####MD_INLINE_';
export const MARKDOWN_MENTION_PREFIX = '####MD_MENTION_';
export const MARKDOWN_TABLE_GUARD_PREFIX = '####MD_TABLEGUARD_';
export const MARKDOWN_LIST_TAG_PREFIX = '####MDLISTTAG';

// Code/inline-code/table placeholders carry a per-render nonce
// (####MD_CODE_<nonce>_<index>####, see createMarkdownNonce) so a sender cannot type a
// literal copy of a placeholder and have the stored block replicated into it on restore
// (client-side amplification DoS). This pattern only isolates code spans so applyHtmlRules
// skips entity-decoding inside them — it needs to find ANY code placeholder, so it stays
// nonce-agnostic ([a-z0-9]+ = the Math.random/base36 nonce); the exact per-render restore
// patterns are built with the actual nonce by CodeProtector.
export const MARKDOWN_CODE_PATTERN = /(####MD_CODE_[a-z0-9]+_\d+####)/;

// Canonical [table] BB-code block (single line). Used to stash genuine tables
// during the inline/block/html rules (TableMarkerProtector) and again before the
// global font/url decoders (NestedTagHandler.cutTableTag), so cells render once.
export const MARKDOWN_TABLE_PATTERN = /\[table][\s\S]*?\[\/table]/gi;

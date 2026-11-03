export const NEW_LINE = '\n';

// Head and tail shared by every markdown placeholder. The per-kind prefixes below are built
// from them, and so is the guard that has to recognize a placeholder of ANY kind
// (renderPlaceholderPattern in rules/inline-rules.js) - renaming here must not leave that
// guard matching the old shape.
export const MARKDOWN_PLACEHOLDER_PREFIX = '####MD';
export const MARKDOWN_PLACEHOLDER_SUFFIX = '####';
export const MARKDOWN_CODE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_CODE_`;
export const MARKDOWN_ESCAPE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_ESC_`;
export const MARKDOWN_INLINE_CODE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_INLINE_`;
export const MARKDOWN_MENTION_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_MENTION_`;
export const MARKDOWN_URL_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_URL_`;
export const MARKDOWN_BB_TAG_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_BBTAG_`;
export const MARKDOWN_TABLE_GUARD_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_TABLEGUARD_`;
// The odd one out: no second underscore and no nonce.
export const MARKDOWN_LIST_TAG_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}LISTTAG`;

// Not a placeholder of the render: the mask BbTagProtector lays over an inline code span for
// the length of its own scan (####MDSPAN<nonce>-<index>####). It carries no '[', ']', '`', '*'
// or '_', so no tag pattern can read it as markup, and it never leaves protect().
export const MARKDOWN_CODE_SPAN_MASK_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}SPAN`;

// The inline code spans, longest fence first. protectInlineCode (rules/inline-rules.js) stores
// them and BbTagProtector masks them before it looks for ready tags, so a tag typed inside a
// span is never taken for a live one; both read the grammar from here. Global patterns shared
// by two callers: use them through replaceAll only, which resets lastIndex.
export const MARKDOWN_INLINE_CODE_TRIPLE_PATTERN = /```(.+?)```/g;
export const MARKDOWN_INLINE_CODE_DOUBLE_PATTERN = /``(.+?)``/g;
export const MARKDOWN_INLINE_CODE_SINGLE_PATTERN = /`([^`]+)`/g;
export const MARKDOWN_INLINE_CODE_SPAN_PATTERNS = [
	MARKDOWN_INLINE_CODE_TRIPLE_PATTERN,
	MARKDOWN_INLINE_CODE_DOUBLE_PATTERN,
	MARKDOWN_INLINE_CODE_SINGLE_PATTERN,
];

// Ceiling for the link/image destination scan (destination + optional title + the skipped
// spaces around it), counted in source characters from the "](" prefix. Well above any real
// URL (OAuth-redirect and tracking links run past 2000 chars) yet bounded, so a crafted
// message cannot make the scanner walk the whole text from every "](" - a boundary test pins
// the value.
export const MAX_URL_SCAN_LENGTH = 8192;

// Characters a backslash can escape inside a destination: the pair `\X` yields a literal X
// that takes no part in paren balancing or in the <...> boundaries.
//
// Only '<' is listed, and the reason is the stage order, not the grammar. EscapeHandler runs
// first (MarkdownConverter.#protectBase) and turns every pair it owns into a placeholder, so a
// backslash before one of its characters never reaches this scan; '<' is the one destination
// character outside its set (escape-handler.js). Listing the others here would be dead weight
// that reads as live logic. Revisit the moment escape protection stops running first.
export const ESCAPABLE_CHARS = ['<'];

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

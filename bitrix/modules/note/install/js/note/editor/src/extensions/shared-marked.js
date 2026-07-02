import { Marked } from 'marked';

/**
 * Shared Marked instance for the note editor.
 *
 * CONTRACT: Every custom block-level tokenizer extension (e.g. EnrichedAssetTokenizer,
 * Callout) MUST be registered via the @tiptap/markdown extensions list in registry.js.
 * Registration happens automatically: MarkdownManager.registerTokenizer() calls
 * markedInstance.use() on this shared instance.
 *
 * This matters because recursive lexing (e.g. sharedMarked.lexer() inside callout body
 * parsing) only sees tokenizers that have been registered with this instance.
 *
 * If you add a new block tokenizer:
 *   1. Create the extension with a `markdownTokenizer` property
 *   2. Add it to the extensions array in registry.js (createEditorExtensions)
 *   3. Verify it works inside a callout body — that exercises recursive lexing
 *
 * The instance disables HTML tokenization (treats <tag> as plain text).
 * Assumes marked ^17.0.x (bundled via @tiptap/markdown).
 */
const _sharedMarked: Object = new Marked({
	tokenizer: {
		// Disable HTML tokenization — treat <tag> as plain text
		html() {},
		tag() {},
	},
});

// Workaround for @tiptap/markdown bug: MarkdownManager.createLexer() calls
// `new this.markedInstance.Lexer()` without passing instance defaults, so
// custom block tokenizers (callout, enrichedAsset) registered via .use()
// are lost in the created Lexer. Override .Lexer to auto-inject current
// defaults when no options are provided.
const OriginalLexer = _sharedMarked.Lexer;
const markedRef = _sharedMarked;
_sharedMarked.Lexer = class PatchedLexer extends OriginalLexer {
	constructor(options?: Object)
	{
		super(options ?? markedRef.defaults);
	}
};

export const sharedMarked: Object = _sharedMarked;

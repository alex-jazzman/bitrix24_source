import { Type } from 'main.core';

import { BbTagProtector } from './utils/bb-tag-protector.js';
import { CodeProtector } from './utils/code-protector.js';
import { EscapeHandler } from './utils/escape-handler.js';
import { MentionProtector } from './utils/mention-protector.js';
import { UrlProtector } from './utils/url-protector.js';
import { createMarkdownNonce } from './utils/nonce.js';
import { applyBlockRules } from './rules/block-rules.js';
import { applyInlineRules, applyCellInlineRules, restoreInlineCode } from './rules/inline-rules.js';
import { applyHtmlRules } from './rules/html-rules.js';
import { convertLists, ListTagProtector, ORDERED_MARKER_SOURCE } from './rules/list-rules.js';
import { convertTables, TableMarkerProtector } from './rules/table-rules.js';

// Fast-path: skip the whole pipeline when the text carries no Markdown-significant shape.
// Deliberately NOT triggered by a bare "[" or "=" — those appear in ordinary BB-code
// ([USER=…], [URL=…], [DISK=…]) which has no Markdown to convert. Instead each real shape
// is matched precisely: link/image via "](", setext-H1 via "={3}", list bullets/ordered
// markers via the line-anchored alternation, rules/setext-H2/table separators via "-{3}".
// The ordered branch reuses ORDERED_MARKER_SOURCE, so this probe cannot let through a
// marker convertLists would refuse anyway.
const MARKDOWN_TRIGGER = new RegExp(
	`[\\t!#&*+<>\\\\_\`|~]|\\]\\(|^[ \\t]*(?:-|${ORDERED_MARKER_SOURCE})[ \\t]|-{3}|={3}`,
	'm',
);

class MarkdownConverter
{
	/**
	 * Convert Markdown to BB-codes for full message rendering.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	static decode(text: string): string
	{
		return MarkdownConverter.#convert(text, { mode: 'decode' });
	}

	/**
	 * Convert Markdown to BB-codes for preview/notification text.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	static simplify(text: string): string
	{
		return MarkdownConverter.#convert(text, { mode: 'simplify' });
	}

	/**
	 * @param {string} text
	 * @param {object} tableOptions
	 * @returns {string}
	 */
	static #convert(text: string, tableOptions: Object): string
	{
		if (!Type.isStringFilled(text))
		{
			return '';
		}

		if (!MARKDOWN_TRIGGER.test(text))
		{
			return text;
		}

		// One per-render nonce shared by the placeholder protectors so a sender cannot type a
		// literal placeholder copy and have a stored block replicated into it on restore
		// (amplification DoS; see utils/nonce.js). convertTables/convertLists run their own
		// self-contained cell protect→restore (applyCellInlineRules) with their own nonce.
		const nonce = createMarkdownNonce();
		const escapeHandler = new EscapeHandler();
		const codeProtector = new CodeProtector(nonce);
		const mentionProtector = new MentionProtector(nonce);
		const bbTagProtector = new BbTagProtector(nonce);
		const tableMarkerProtector = new TableMarkerProtector(nonce);
		const listTagProtector = new ListTagProtector();
		const urlProtector = new UrlProtector(nonce);
		const protectors = { codeProtector, mentionProtector, bbTagProtector, escapeHandler };

		text = MarkdownConverter.#protectBase(text, protectors, { looseFence: true });

		// One UrlProtector for the whole call: cell links (convertTables/convertLists) and the
		// full inline pass share it, so every destination is restored at the single point below.
		// The BbTagProtector rides along the same path: its placeholders live in cell content
		// too, and the label acceptors of the link/image rules have to recognize them there as well.
		text = convertTables(text, { ...tableOptions, urlProtector, bbTagProtector });
		text = convertLists(text, { ...tableOptions, urlProtector, bbTagProtector });

		text = tableMarkerProtector.protect(text);
		text = listTagProtector.protect(text);

		text = applyBlockRules(text);
		const inlineCodeBlocks = [];
		// escapeHandler rides along for the image rule alone: the alt is encoded past the reach of
		// the restore below, so the escapes of a label are expanded there instead (createEscapeExpander).
		text = applyInlineRules(text, {
			deferredCodeStorage: inlineCodeBlocks,
			nonce,
			urlProtector,
			bbTagProtector,
			escapeHandler,
		});
		text = applyHtmlRules(text);
		text = restoreInlineCode(text, inlineCodeBlocks, nonce);

		text = listTagProtector.restore(text);
		text = tableMarkerProtector.restore(text);

		// Restore URLs AFTER the table is un-stashed (a cell's placeholder lives inside the
		// hidden [table]) and BEFORE #restoreBase (the URL may hold escape placeholders).
		text = urlProtector.restore(text);

		text = MarkdownConverter.#restoreBase(text, protectors);

		return text;
	}

	/**
	 * Convert Markdown to BB-codes keeping only inline markup: bold / italic /
	 * strikethrough, links, autolinks and inline code. Block constructs whose
	 * meaning comes from a leading line marker (lists, tables, headings, quotes,
	 * rules) are NOT produced - their markers stay literal text. Images are left
	 * out too (applyCellInlineRules), so a `![alt](url)` never grows into a block
	 * <img>.
	 *
	 * Code blocks are the deliberate exception: fenced (```/~~~, including the
	 * "loose" multi-line form whose closing fence sits mid-line - protected on
	 * both paths, see #convert), indented and legacy [code]...[/code] are
	 * INTENTIONALLY rendered as one block code box (bx-im-message-content-code),
	 * never as inline code. This mirrors the legacy [code] behavior and keeps a
	 * pasted multi-line block from fragmenting into orphaned backticks + per-line
	 * inline boxes. Single/double/triple-backtick single-line spans stay inline
	 * code as before.
	 *
	 * Used for list items / table cells / headings / quotes / rules content of the
	 * Copilot rich-answer constructor (Parser.decodeInlineText).
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	static decodeInline(text: string): string
	{
		if (!Type.isStringFilled(text))
		{
			return '';
		}

		if (!MARKDOWN_TRIGGER.test(text))
		{
			return text;
		}

		const nonce = createMarkdownNonce();
		const escapeHandler = new EscapeHandler();
		const codeProtector = new CodeProtector(nonce);
		const mentionProtector = new MentionProtector(nonce);
		const bbTagProtector = new BbTagProtector(nonce);
		const urlProtector = new UrlProtector(nonce);
		const protectors = { codeProtector, mentionProtector, bbTagProtector, escapeHandler };

		text = MarkdownConverter.#protectBase(text, protectors, { looseFence: true });

		// Inline-only: no block rules and no table/list protectors. applyCellInlineRules
		// runs its own self-contained inline-code protect->restore (no images), so the
		// restored [icode] is in place BEFORE applyHtmlRules. This order is deliberate:
		// it reproduces the table-cell precedent (#convert -> convertTables ->
		// applyCellInlineRules, whose [icode] also reaches the global applyHtmlRules already
		// restored), NOT the full non-cell path (applyInlineRules defers restoreInlineCode
		// until AFTER applyHtmlRules). Consequence: whitelist HTML inside inline code (<b> etc.)
		// is converted by applyHtmlRules; non-whitelist HTML (<script>) is left inert and gets
		// escaped by the downstream Text.encode - no XSS either way.
		text = applyCellInlineRules(text, { urlProtector, bbTagProtector });
		text = applyHtmlRules(text);

		// Single restore point, after applyHtmlRules and before #restoreBase (the URL may hold
		// escape placeholders): the destination stays a placeholder through the inline/html
		// rules and returns byte-for-byte here.
		text = urlProtector.restore(text);

		text = MarkdownConverter.#restoreBase(text, protectors);

		return text;
	}

	/**
	 * Apply the base placeholder protectors (code -> mention -> BB-tag -> escape). The single
	 * source of truth for the protect order shared by #convert and decodeInline.
	 *
	 * Code goes first so a [URL]/[img] typed inside [code] stays literal; mentions go before the
	 * BB-tag protector so MentionProtector keeps matching whole containers, and a [URL] nested in
	 * a mention is carried inside the stored mention instead of being stored twice.
	 *
	 * @param {string} text
	 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, bbTagProtector: BbTagProtector, escapeHandler: EscapeHandler}} protectors
	 * @param {{ looseFence?: boolean }} [options] Forwarded to CodeProtector.protect; looseFence
	 *   captures multi-line "loose" fenced code as one [code] block. Both #convert and decodeInline
	 *   enable it, so the two paths render such a block identically.
	 * @returns {string}
	 */
	static #protectBase(text: string, protectors: Object, options: Object = {}): string
	{
		const { codeProtector, mentionProtector, bbTagProtector, escapeHandler } = protectors;

		text = codeProtector.protect(text, options);
		text = mentionProtector.protect(text);
		text = bbTagProtector.protect(text);
		text = escapeHandler.protect(text);

		return text;
	}

	/**
	 * Restore the base placeholder protectors in LIFO order (escape -> BB-tag -> mention -> code).
	 * Mirror of #protectBase, shared by #convert and decodeInline.
	 *
	 * @param {string} text
	 * @param {{
	 *     codeProtector: CodeProtector,
	 *     mentionProtector: MentionProtector,
	 *     bbTagProtector: BbTagProtector,
	 *     escapeHandler: EscapeHandler,
	 * }} protectors
	 * @returns {string}
	 */
	static #restoreBase(text: string, protectors: Object): string
	{
		const { codeProtector, mentionProtector, bbTagProtector, escapeHandler } = protectors;

		text = escapeHandler.restore(text);
		text = bbTagProtector.restore(text);
		text = mentionProtector.restore(text);
		text = codeProtector.restore(text);

		return text;
	}
}

export { MarkdownConverter };

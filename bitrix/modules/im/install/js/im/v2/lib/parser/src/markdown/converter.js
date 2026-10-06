import { Type } from 'main.core';

import { CodeProtector } from './utils/code-protector.js';
import { EscapeHandler } from './utils/escape-handler.js';
import { MentionProtector } from './utils/mention-protector.js';
import { createMarkdownNonce } from './utils/nonce.js';
import { applyBlockRules } from './rules/block-rules.js';
import { applyInlineRules, applyCellInlineRules, restoreInlineCode } from './rules/inline-rules.js';
import { applyHtmlRules } from './rules/html-rules.js';
import { convertLists, ListTagProtector } from './rules/list-rules.js';
import { convertTables, TableMarkerProtector } from './rules/table-rules.js';

// Fast-path: skip the whole pipeline when the text carries no Markdown-significant shape.
// Deliberately NOT triggered by a bare "[" or "=" — those appear in ordinary BB-code
// ([USER=…], [URL=…], [DISK=…]) which has no Markdown to convert. Instead each real shape
// is matched precisely: link/image via "](", setext-H1 via "={3}", list bullets/ordered
// markers via the line-anchored alternation, rules/setext-H2/table separators via "-{3}".
const MARKDOWN_TRIGGER = /[\t!#&*+<>\\_`|~]|\]\(|^[ \t]*(?:-|\d+\.)[ \t]|-{3}|={3}/m;

class MarkdownConverter
{
	/**
	 * Apply the base placeholder protectors (code -> mention -> escape). The single
	 * source of truth for the protect order shared by #convert and decodeInline.
	 *
	 * @param {string} text
	 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, escapeHandler: EscapeHandler}} protectors
	 * @param {{ looseFence?: boolean }} [options] Forwarded to CodeProtector.protect; looseFence is
	 *   inline-only (decodeInline) and captures multi-line "loose" fenced code as one [code] block.
	 * @returns {string}
	 */
	static #protectBase(text: string, protectors: Object, options: Object = {}): string
	{
		const { codeProtector, mentionProtector, escapeHandler } = protectors;

		text = codeProtector.protect(text, options);
		text = mentionProtector.protect(text);
		text = escapeHandler.protect(text);

		return text;
	}

	/**
	 * Restore the base placeholder protectors in LIFO order (escape -> mention -> code).
	 * Mirror of #protectBase, shared by #convert and decodeInline.
	 *
	 * @param {string} text
	 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, escapeHandler: EscapeHandler}} protectors
	 * @returns {string}
	 */
	static #restoreBase(text: string, protectors: Object): string
	{
		const { codeProtector, mentionProtector, escapeHandler } = protectors;

		text = escapeHandler.restore(text);
		text = mentionProtector.restore(text);
		text = codeProtector.restore(text);

		return text;
	}

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
	 * Convert Markdown to BB-codes keeping only inline markup: bold / italic /
	 * strikethrough, links, autolinks and inline code. Block constructs whose
	 * meaning comes from a leading line marker (lists, tables, headings, quotes,
	 * rules) are NOT produced - their markers stay literal text. Images are left
	 * out too (applyCellInlineRules), so a `![alt](url)` never grows into a block
	 * <img>.
	 *
	 * Code blocks are the deliberate exception: fenced (```/~~~, including the
	 * "loose" multi-line form whose closing fence sits mid-line), indented and
	 * legacy [code]...[/code] are INTENTIONALLY rendered as one block code box
	 * (bx-im-message-content-code), never as inline code. This mirrors the legacy
	 * [code] behavior and keeps a pasted multi-line block from fragmenting into
	 * orphaned backticks + per-line inline boxes. Single/double/triple-backtick
	 * single-line spans stay inline code as before.
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
		const protectors = { codeProtector, mentionProtector, escapeHandler };

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
		text = applyCellInlineRules(text);
		text = applyHtmlRules(text);

		text = MarkdownConverter.#restoreBase(text, protectors);

		return text;
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
		const tableMarkerProtector = new TableMarkerProtector(nonce);
		const listTagProtector = new ListTagProtector();
		const protectors = { codeProtector, mentionProtector, escapeHandler };

		text = MarkdownConverter.#protectBase(text, protectors);

		text = convertTables(text, tableOptions);
		text = convertLists(text, tableOptions);

		text = tableMarkerProtector.protect(text);
		text = listTagProtector.protect(text);

		text = applyBlockRules(text);
		const inlineCodeBlocks = [];
		text = applyInlineRules(text, inlineCodeBlocks, nonce);
		text = applyHtmlRules(text);
		text = restoreInlineCode(text, inlineCodeBlocks, nonce);

		text = listTagProtector.restore(text);
		text = tableMarkerProtector.restore(text);

		text = MarkdownConverter.#restoreBase(text, protectors);

		return text;
	}
}

export { MarkdownConverter };

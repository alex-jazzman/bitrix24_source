<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Search;

final class MarkdownStripper
{
	/**
	 * @var string[]
	 */
	private const PATTERNS = [
		// HTML comments (multi-line).
		'/<!--.*?-->/su',
		// Fenced code-block fences (keep the body in between).
		'/^\s*```[^\n]*$/mu',
		// Enriched-asset `![label](url){type=image fileId=N ...}` — must run BEFORE plain images.
		'/!\[[^\]]*\]\([^)]*\)\{[^}]*\}/u',
		// Plain images `![alt](url)`.
		'/!\[[^\]]*\]\([^)]*\)/u',
		// Compact asset tokens `[[image|video|file fileId=N ...]]`.
		'/\[\[(?:image|video|file) fileId=\d+[^\]\n]*\]\]/u',
		// Table separator rows, with optional alignment (`:---`, `---:`, `:---:`).
		'/^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/mu',
		// Table data rows: strip leading/trailing pipe. Inner pipes are collapsed in the post-pass.
		'/^\s*\|(.+)\|\s*$/mu',
		// Callout fences `:::info` / `:::tip` / closing `:::`.
		'/^:::\s*\w*\s*$/mu',
		// Mention token `@{type:id}` — strip entirely (label not available at this layer).
		'/@\{[a-z]+:\d+\}/u',
		// Strikethrough `~~text~~` — keep text.
		'/~~([^~]+)~~/u',
		// Existing patterns.
		'/^#{1,6}\s+/mu',            // headings
		'/\*{1,3}([^*]+)\*{1,3}/u',  // bold / italic (*)
		'/`{1,3}([^`\n]*)`{1,3}/u',  // inline code: keep text, strip backticks (fenced blocks already gone)
		'/^\s*[-*+]\s+/mu',          // bullet lists
		'/^\s*\d+\.\s+/mu',          // ordered lists
		'/\[([^\]]+)\]\([^)]+\)/u',  // links (keep text)
		'/^>\s+/mu',                 // blockquote
		'/^-{3,}$/mu',               // horizontal rule
		'/_{1,2}([^_]+)_{1,2}/u',    // bold / italic (_)
	];

	/**
	 * @var string[]
	 */
	private const REPLACEMENTS = [
		'',          // HTML comments
		'',          // fenced code fences
		'',          // enriched asset
		'',          // plain images
		'',          // compact asset tokens
		'',          // table separator
		'$1',        // table data row
		'',          // callout fences
		'',   // mention token: strip entirely
		'$1',        // strikethrough
		'',          // headings
		'$1',        // bold / italic (*)
		'$1',        // inline code
		'',          // bullet lists
		'',          // ordered lists
		'$1',        // links
		'',          // blockquote
		'',          // horizontal rule
		'$1',        // bold / italic (_)
	];

	public function strip(string $md): string
	{
		$stripped = preg_replace(self::PATTERNS, self::REPLACEMENTS, $md);
		if ($stripped === null)
		{
			return $md;
		}

		// Collapse pipes left over from table cells (after the data-row pattern removed outer ones).
		$stripped = (string)preg_replace('/[ \t]*\|[ \t]*/u', ' ', $stripped);
		// Collapse runs of blank lines to a single blank.
		$stripped = (string)preg_replace('/\n{3,}/u', "\n\n", $stripped);

		return $stripped;
	}
}

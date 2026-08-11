<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source\Wiki;

/**
 * Converts a wiki page body (MediaWiki-like markup or HTML) into markdown,
 * emitting the canonical markers (ALG-01) that the wiki transformers resolve:
 *   - internal link  [[Name]] / [[Name|label]]  -> [label](wiki-mention://{enc id})
 *   - file/image      [[File:name]]              -> ![name](wiki-asset://{fileId})
 *
 * Marker ids come from WikiId so they match ImportMap exactly. Dropped
 * constructs (__TOC__, the --~~~~ signature) leave no artifact. Category
 * assignment links ([[Category:X]]) are stripped — the category lives in the
 * tree, not in the body.
 */
class WikiMarkupConverter
{
	/** @var array<int, string> id => ORIGINAL_NAME */
	private array $fileById = [];
	/** @var array<string, int> lower(ORIGINAL_NAME) => id */
	private array $fileByName = [];

	private array $protectedCode = [];
	private array $protectedNowiki = [];

	public function __construct(private readonly string $collectionId)
	{
	}

	/**
	 * @param int[] $fileIds Ids from the page IMAGES property.
	 */
	public function convert(string $detailText, string $type, array $fileIds): string
	{
		$this->protectedCode = [];
		$this->protectedNowiki = [];
		$this->loadFiles($fileIds);

		$text = $detailText;

		// 0. Security (IDOR): the wiki-asset:// and wiki-mention:// schemes are
		//    reserved for markers this converter emits for files/pages it has
		//    actually resolved (asset ids always come from the page IMAGES set).
		//    A page author could otherwise embed a literal marker pointing at an
		//    arbitrary b_file id and have WikiSource::downloadAttachment() copy
		//    that file into the note on import. Strip any such literal from the
		//    raw source up front so only converter-emitted markers can ever reach
		//    the transformers. Done before protect() so it also covers
		//    code/nowiki regions and html href/src, which are restored/emitted
		//    verbatim by later passes.
		$text = $this->neutralizeReservedMarkers($text);

		// 1. Protect verbatim regions so later passes (incl. html cleanup) skip them.
		$text = $this->protect($text);

		// 2. Redirect: keep only the target link — Q-2: redirect page becomes a link stub.
		$text = preg_replace('/^\s*#REDIRECT\s*/iu', '', $text) ?? $text;

		// 3. Block/inline wiki constructs.
		$text = $this->convertHeaders($text);
		$text = $this->convertEmphasis($text);
		$text = preg_replace('/^-{4,}\s*$/mu', "\n---\n", $text) ?? $text;

		// 4. Links and files (files first so [[File:..]] is not eaten as a page link).
		$text = $this->convertFiles($text);
		$text = $this->convertInternalLinks($text);
		$text = $this->convertExternalLinks($text);

		// 5. Drop no-op constructs.
		$text = str_ireplace('__TOC__', '', $text);
		$text = preg_replace('/--~~~~+/u', '', $text) ?? $text;

		// 6. Normalize residual HTML (heavy lifting for html-mode bodies, cleanup
		//    of embedded tags for text-mode bodies). Markers are markdown, untouched.
		$text = $this->htmlToMarkdown($text);

		// 7. Restore verbatim regions after html cleanup so their content stays literal.
		$text = $this->restore($text);

		// 8. Tidy whitespace.
		$text = preg_replace("/\n{3,}/u", "\n\n", $text) ?? $text;

		return trim($text);
	}

	/**
	 * Breaks the "://" of any literal wiki-asset/wiki-mention scheme found in the
	 * raw body so it can no longer be parsed as a converter marker. The text stays
	 * readable ("wiki-asset-//123") but inert; legitimate markers are emitted by
	 * later passes and are unaffected.
	 */
	private function neutralizeReservedMarkers(string $text): string
	{
		return preg_replace('/wiki-(asset|mention):\/\//iu', 'wiki-$1-//', $text) ?? $text;
	}

	private function loadFiles(array $fileIds): void
	{
		$this->fileById = [];
		$this->fileByName = [];

		foreach ($fileIds as $fileId)
		{
			$fileId = (int)$fileId;
			if ($fileId <= 0)
			{
				continue;
			}

			$file = \CFile::GetFileArray($fileId);
			if (!is_array($file))
			{
				continue;
			}

			$name = (string)($file['ORIGINAL_NAME'] ?? $file['FILE_NAME'] ?? '');
			$this->fileById[$fileId] = $name;
			if ($name !== '')
			{
				$this->fileByName[mb_strtolower($name)] = $fileId;
			}
		}
	}

	private function protect(string $text): string
	{
		// <pre> is a preformatted block: capture it whole (first, so its content is
		// not re-scanned by the constructs below) and route it through the same
		// protected-code bucket as {{{...}}} so restore() emits a fenced ``` block.
		// This keeps newlines (a multi-line <pre> must not collapse into a backtick
		// span) and stops adjacent blocks gluing into "````". An inner <code>
		// wrapper is unwrapped; entities are decoded now because the block is
		// restored verbatim after the html cleanup pass.
		$text = preg_replace_callback('#<\s*pre\b[^>]*>(.*?)<\s*/\s*pre\s*>#isu', function (array $m): string {
			$code = preg_replace('#<\s*/?\s*code\b[^>]*>#iu', '', $m[1]) ?? $m[1];
			$code = html_entity_decode($code, ENT_QUOTES | ENT_HTML5, 'UTF-8');
			$i = count($this->protectedCode);
			$this->protectedCode[] = $code;

			return '##WIKICODE' . $i . '##';
		}, $text) ?? $text;

		$text = preg_replace_callback('/\{\{\{(.*?)\}\}\}/su', function (array $m): string {
			$i = count($this->protectedCode);
			$this->protectedCode[] = $m[1];

			return '##WIKICODE' . $i . '##';
		}, $text) ?? $text;

		$text = preg_replace_callback('/\[CODE\](.*?)\[\/CODE\]/isu', function (array $m): string {
			$i = count($this->protectedCode);
			$this->protectedCode[] = $m[1];

			return '##WIKICODE' . $i . '##';
		}, $text) ?? $text;

		$text = preg_replace_callback('/<nowiki>(.*?)<\/nowiki>/isu', function (array $m): string {
			$i = count($this->protectedNowiki);
			$this->protectedNowiki[] = $m[1];

			return '##WIKINOWIKI' . $i . '##';
		}, $text) ?? $text;

		return $text;
	}

	private function restore(string $text): string
	{
		$text = preg_replace_callback('/##WIKINOWIKI(\d+)##/u', function (array $m): string {
			return $this->protectedNowiki[(int)$m[1]] ?? '';
		}, $text) ?? $text;

		$text = preg_replace_callback('/##WIKICODE(\d+)##/u', function (array $m): string {
			$code = $this->protectedCode[(int)$m[1]] ?? '';
			$code = trim($code, "\r\n");

			return "\n```\n" . $code . "\n```\n";
		}, $text) ?? $text;

		return $text;
	}

	private function convertHeaders(string $text): string
	{
		for ($level = 6; $level >= 1; $level--)
		{
			$eq = str_repeat('=', $level);
			$text = preg_replace_callback(
				'/^\s*' . $eq . '\s*(.+?)\s*' . $eq . '\s*$/mu',
				static fn (array $m): string => "\n" . str_repeat('#', $level) . ' ' . trim($m[1]) . "\n",
				$text,
			) ?? $text;
		}

		return $text;
	}

	private function convertEmphasis(string $text): string
	{
		$text = preg_replace('/\x27{3}(.+?)\x27{3}/su', '**$1**', $text) ?? $text;
		$text = preg_replace('/\x27{2}(.+?)\x27{2}/su', '*$1*', $text) ?? $text;

		return $text;
	}

	private function convertInternalLinks(string $text): string
	{
		return preg_replace_callback('/\[\[([^\]]+)\]\]/u', function (array $m): string {
			$inner = $m[1];
			$parts = explode('|', $inner, 2);
			$target = trim($parts[0]);
			$label = isset($parts[1]) && trim($parts[1]) !== '' ? trim($parts[1]) : $target;

			if ($target === '')
			{
				return '';
			}

			// [[Category:X]] is a category assignment, not a visible link.
			$catName = '';
			if (\CWikiUtils::IsCategoryPage($target, $catName))
			{
				return '';
			}

			$externalId = WikiId::pageExternalId($this->collectionId, $target);

			return '[' . $label . '](' . WikiId::mentionMarker($externalId) . ')';
		}, $text) ?? $text;
	}

	private function convertExternalLinks(string $text): string
	{
		return preg_replace_callback(
			'/\[((?:https?|ftp):\/\/[^\]\s]+)(?:\s+([^\]]+))?\]/iu',
			static function (array $m): string {
				$url = trim($m[1]);
				$label = isset($m[2]) && trim($m[2]) !== '' ? trim($m[2]) : $url;

				return '[' . $label . '](' . $url . ')';
			},
			$text,
		) ?? $text;
	}

	private function convertFiles(string $text): string
	{
		$fileWords = ['File', 'Файл'];
		$localized = (string)\GetMessage('FILE_NAME');
		if ($localized !== '' && !in_array($localized, $fileWords, true))
		{
			$fileWords[] = $localized;
		}
		$alt = implode('|', array_map(static fn (string $w): string => preg_quote($w, '/'), $fileWords));

		return preg_replace_callback(
			'/\[\[?:?(?:' . $alt . '):\s*([^\]|]+?)(?:\|[^\]]*)?\]\]?/iu',
			function (array $m): string {
				$ref = trim($m[1]);
				$fileId = $this->resolveFileId($ref);

				if ($fileId === null)
				{
					return '';
				}

				$name = $this->fileById[$fileId] ?? $ref;

				return '![' . $name . '](' . WikiId::assetMarker($fileId) . ')';
			},
			$text,
		) ?? $text;
	}

	private function resolveFileId(string $ref): ?int
	{
		if (preg_match('/^[0-9]+$/D', $ref) === 1 && isset($this->fileById[(int)$ref]))
		{
			return (int)$ref;
		}

		$byName = $this->fileByName[mb_strtolower($ref)] ?? null;

		return $byName !== null ? (int)$byName : null;
	}

	/**
	 * Minimal HTML → markdown. Q-4 default: covers the common tags; anything
	 * unknown is stripped to text. Markdown link syntax built earlier is left
	 * intact (only HTML tags and entities are touched).
	 */
	private function htmlToMarkdown(string $text): string
	{
		if (!str_contains($text, '<') && !str_contains($text, '&'))
		{
			return $text;
		}

		// <script>/<style> have no markdown equivalent and their bodies are not
		// content: the trailing strip_tags below would drop the tags but leave the
		// raw JS/CSS as visible text (e.g. rendered like-widget chrome pasted into a
		// body). Drop the whole element, content included, before anything else.
		$text = preg_replace('#<\s*(script|style)\b[^>]*>.*?<\s*/\s*\1\s*>#isu', '', $text) ?? $text;

		// Markdown inline emphasis cannot span a line break, must hug its content
		// (a marker next to whitespace is not "flanking" and fails to form), and
		// directly-adjacent same-type spans glue into a stray "****". Normalize the
		// emphasis HTML tags before the tag rules below, in this order:
		//   1. pull trailing break(s) out of the span: <b>x<br></b> -> <b>x</b><br>
		//      so the closing marker is not orphaned on its own line;
		//   2. pull boundary whitespace/&nbsp; outside the markers: <b>x </b> -> <b>x</b> ;
		//   3. drop emphasis that now wraps nothing: <b></b> / <b>&nbsp;</b> -> removed;
		//   4. merge directly-adjacent same-type spans: <b>a</b><b>b</b> -> <b>ab</b>.
		$emphasis = '(?:b|strong|i|em)';
		$ws = '(?:\s|&nbsp;|&#160;)';
		// 1.
		$text = preg_replace(
			'/((?:<\s*br(?=[\s\/>])[^>]*>\s*)+)(<\s*\/\s*' . $emphasis . '\s*>)/iu',
			'$2$1',
			$text,
		) ?? $text;
		// 2. boundary whitespace moved outside the markers (kept verbatim).
		$text = preg_replace('/(' . $ws . '+)(<\s*\/\s*' . $emphasis . '\s*>)/iu', '$2$1', $text) ?? $text;
		$text = preg_replace('/(<\s*' . $emphasis . '(?=[\s\/>])[^>]*>)(' . $ws . '+)/iu', '$2$1', $text) ?? $text;
		// 3.
		$text = preg_replace(
			'/<\s*(' . $emphasis . ')(?=[\s\/>])[^>]*>' . $ws . '*<\s*\/\s*\1\s*>/iu',
			'',
			$text,
		) ?? $text;
		// 4.
		$text = preg_replace('/<\s*\/\s*(' . $emphasis . ')\s*><\s*\1(?=[\s\/>])[^>]*>/iu', '', $text) ?? $text;

		// Open-tag rules anchor the tag name with a (?=[\s\/>]) lookahead so they
		// match only the tag itself and not any tag whose name merely starts with
		// the same letter: <br> stays a line break (incl. with attributes) instead
		// of being eaten by the bold rule, <img>/<input> reach the image rule/strip
		// instead of the italic rule, and <pre>/<param> reach the code rule instead
		// of the paragraph rule. <br> stays first so it wins over the bold rule.
		$replacements = [
			'/<\s*br(?=[\s\/>])[^>]*>/iu' => "\n",
			'/<\s*\/\s*p\s*>/iu' => "\n\n",
			'/<\s*p(?=[\s\/>])[^>]*>/iu' => "\n\n",
			// <div> has no markdown equivalent; treat its boundaries as a block
			// break so adjacent block divs are not merged onto one line. Redundant
			// breaks (e.g. around nested <p>) collapse via the \n{3,} cleanup below.
			'/<\s*\/?\s*div[^>]*>/iu' => "\n\n",
			'/<\s*\/\s*(?:b|strong)\s*>/iu' => '**',
			'/<\s*(?:b|strong)(?=[\s\/>])[^>]*>/iu' => '**',
			'/<\s*\/\s*(?:i|em)\s*>/iu' => '*',
			'/<\s*(?:i|em)(?=[\s\/>])[^>]*>/iu' => '*',
			'/<\s*hr[^>]*>/iu' => "\n---\n",
			'/<\s*li[^>]*>/iu' => "\n- ",
			'/<\s*\/\s*li\s*>/iu' => '',
			'/<\s*\/?\s*(?:ul|ol)[^>]*>/iu' => "\n",
			'/<\s*\/?\s*(?:pre|code)[^>]*>/iu' => '`',
		];
		$text = preg_replace(array_keys($replacements), array_values($replacements), $text) ?? $text;

		// Headers.
		for ($level = 1; $level <= 6; $level++)
		{
			$text = preg_replace_callback(
				'/<\s*h' . $level . '[^>]*>(.*?)<\s*\/\s*h' . $level . '\s*>/isu',
				static fn (array $m): string => "\n" . str_repeat('#', $level) . ' ' . trim(strip_tags($m[1])) . "\n",
				$text,
			) ?? $text;
		}

		// Links and images.
		$text = preg_replace_callback(
			'/<\s*a[^>]*href\s*=\s*["\']([^"\']*)["\'][^>]*>(.*?)<\s*\/\s*a\s*>/isu',
			static fn (array $m): string => '[' . trim(strip_tags($m[2])) . '](' . $m[1] . ')',
			$text,
		) ?? $text;
		$text = preg_replace_callback(
			'/<\s*img[^>]*src\s*=\s*["\']([^"\']*)["\'][^>]*>/iu',
			static function (array $m): string {
				$alt = '';
				if (preg_match('/alt\s*=\s*["\']([^"\']*)["\']/iu', $m[0], $a))
				{
					$alt = $a[1];
				}

				return '![' . $alt . '](' . $m[1] . ')';
			},
			$text,
		) ?? $text;

		// Strip any remaining tags, then decode entities.
		$text = strip_tags($text);
		$text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

		return $text;
	}
}

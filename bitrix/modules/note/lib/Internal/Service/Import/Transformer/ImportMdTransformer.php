<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

use Bitrix\Main\IO\Path;

abstract class ImportMdTransformer
{
	/**
	 * Returns regex pattern to match attachment references in markdown.
	 * Pattern MUST have named groups: 'linkPart' for `![...]` or `[...]`,
	 * 'url' for the full URL, 'attachmentId' for the attachment UUID.
	 */
	abstract protected function getPattern(): string;

	/**
	 * Pre-processes source-specific markdown constructs before saving.
	 * Override in subclasses for source-specific transformations.
	 */
	public function preprocessMarkdown(string $markdown): string
	{
		return $markdown;
	}

	/**
	 * Extracts all attachment IDs from markdown text.
	 *
	 * @return string[]
	 */
	public function extractAttachmentIds(string $markdown): array
	{
		preg_match_all($this->getPattern(), $markdown, $matches);

		return array_values(array_unique($matches['attachmentId'] ?? []));
	}

	/**
	 * Replaces attachment URLs with enriched asset syntax using pre-downloaded file data.
	 *
	 * @param string $markdown Source markdown
	 * @param int $documentId Bitrix document ID
	 * @param array<string, array{fileId: int, name: string, size: int, mimeType: string}> $attachmentFileMap
	 */
	public function transform(string $markdown, int $documentId, array $attachmentFileMap): TransformResult
	{
		$fileIds = [];

		$result = preg_replace_callback(
			$this->getPattern(),
			function (array $matches) use ($documentId, $attachmentFileMap, &$fileIds): string {
				$attachmentId = $matches['attachmentId'] ?? null;
				if ($attachmentId === null || !isset($attachmentFileMap[$attachmentId]))
				{
					return $matches[0];
				}

				$file = $attachmentFileMap[$attachmentId];
				$fileIds[] = $file['fileId'];

				return sprintf(
					'[[%s fileId=%d]]',
					$this->resolveType($file['mimeType']),
					$file['fileId'],
				);
			},
			$markdown,
		);

		$result = $this->splitInlineAssets($result ?? $markdown);

		return new TransformResult($result, array_unique($fileIds));
	}

	/**
	 * Regex for block asset token produced by transform():
	 *   [[image|file|video fileId=N(optional attrs)]]
	 */
	private const ASSET_PATTERN = '/(?<raw>\[\[(?:image|file|video) fileId=\d+(?:[^\]\n]*)\]\])/';

	/**
	 * Isolates every enriched asset as a standalone top-level block: pulled to
	 * column 0 and wrapped in blank lines. The block-level tokenizer only
	 * recognises an asset that owns its line and is not lazily absorbed by a
	 * preceding list item or blockquote, so any list/quote nesting around the
	 * source asset is dropped on purpose. Text around the asset keeps its
	 * structural prefix. Fenced code blocks are left untouched.
	 */
	private function splitInlineAssets(string $markdown): string
	{
		if ($markdown === '' || !str_contains($markdown, '[['))
		{
			return $markdown;
		}

		$lines = explode("\n", $markdown);
		$out = [];
		$inFence = false;
		$fenceMarker = '';

		$pushBlank = static function (array &$out): void {
			if (!empty($out) && trim((string)end($out)) !== '')
			{
				$out[] = '';
			}
		};

		// Set after an asset is pulled out of an indented/list context. The lines
		// that followed that asset belonged to the now-broken item; once the list
		// is gone, any line indented by >=4 spaces would be parsed as an indented
		// code block. De-indent those orphans to column 0 until the next real block.
		$deindentOrphans = false;

		// Set after an asset block is emitted: a blank line must follow it. Honoured
		// lazily so an already-blank source line is reused instead of doubled.
		$pendingSep = false;

		foreach ($lines as $line)
		{
			if ($inFence)
			{
				$out[] = $line;
				if (preg_match('/^[ \t]{0,3}' . preg_quote($fenceMarker, '/') . '[ \t]*$/', $line))
				{
					$inFence = false;
					$fenceMarker = '';
				}
				continue;
			}

			if ($pendingSep)
			{
				if (trim($line) !== '')
				{
					$pushBlank($out);
				}
				$pendingSep = false;
			}

			if ($deindentOrphans)
			{
				if (trim($line) === '')
				{
					$out[] = $line;
					continue;
				}
				if (preg_match('/^(?: {4,}|\t)/', $line))
				{
					$out[] = ltrim($line, " \t");
					continue;
				}
				$deindentOrphans = false;
			}

			if (preg_match('/^[ \t]{0,3}(?<fence>```+|~~~+)/', $line, $fenceMatch))
			{
				$out[] = $line;
				$inFence = true;
				$fenceMarker = $fenceMatch['fence'];
				continue;
			}

			$prefixInfo = $this->analyzeLinePrefix($line);
			$body = substr($line, $prefixInfo['prefixLen']);

			if (!preg_match_all(self::ASSET_PATTERN, $body, $matches, PREG_OFFSET_CAPTURE))
			{
				$out[] = $line;
				continue;
			}

			$segments = [];
			$lastEnd = 0;
			foreach ($matches[0] as $match)
			{
				[$rawAsset, $offset] = $match;
				$before = trim(substr($body, $lastEnd, $offset - $lastEnd));
				if ($before !== '')
				{
					$segments[] = ['text', $before];
				}
				$segments[] = ['asset', $rawAsset];
				$lastEnd = $offset + strlen($rawAsset);
			}
			$tail = trim(substr($body, $lastEnd));
			if ($tail !== '')
			{
				$segments[] = ['text', $tail];
			}

			if (empty($segments))
			{
				$out[] = $line;
				continue;
			}

			$first = true;
			foreach ($segments as [$type, $text])
			{
				if ($type === 'asset')
				{
					$pushBlank($out);
					$out[] = $text;
					$pendingSep = true;
				}
				else
				{
					if ($pendingSep)
					{
						$pushBlank($out);
						$pendingSep = false;
					}
					$out[] = ($first ? $prefixInfo['firstPrefix'] : $prefixInfo['contPrefix']) . $text;
				}
				$first = false;
			}

			// Pure asset line lifted out of a list/indent: its trailing siblings
			// may now be orphaned indented continuations.
			if ($prefixInfo['prefixLen'] > 0 && count($segments) === 1 && $segments[0][0] === 'asset')
			{
				$deindentOrphans = true;
			}
		}

		// Trailing blank lines from the per-asset separator carry no meaning in markdown.
		return rtrim(implode("\n", $out), "\n");
	}

	/**
	 * Splits a line's leading structural prefix (blockquote chain + indent +
	 * list marker) from its content body. Returns prefixes used to emit
	 * subsequent split segments while preserving the original block context.
	 *
	 * @return array{prefixLen:int, firstPrefix:string, contPrefix:string}
	 */
	private function analyzeLinePrefix(string $line): array
	{
		preg_match(
			'/^(?<bq>(?:[ \t]*>+[ \t]*)*)(?<indent>[ \t]*)(?<marker>(?:\d+[.)]|[-+*])[ \t]+)?/',
			$line,
			$m,
		);
		$bq = $m['bq'] ?? '';
		$indent = $m['indent'] ?? '';
		$marker = $m['marker'] ?? '';

		$markerAsSpaces = $marker === '' ? '' : str_repeat(' ', strlen($marker));

		return [
			'prefixLen' => strlen($bq) + strlen($indent) + strlen($marker),
			'firstPrefix' => $bq . $indent . $marker,
			'contPrefix' => $bq . $indent . $markerAsSpaces,
		];
	}

	protected function resolveType(string $mimeType): string
	{
		if (str_starts_with($mimeType, 'image/'))
		{
			return 'image';
		}

		if (str_starts_with($mimeType, 'video/'))
		{
			return 'video';
		}

		return 'file';
	}

	protected function detectMimeType(string $fileName): string
	{
		$ext = mb_strtolower(Path::getExtension($fileName));

		return self::MIME_MAP[$ext] ?? 'application/octet-stream';
	}

	protected const MIME_MAP = [
		'jpg' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'png' => 'image/png',
		'gif' => 'image/gif',
		'webp' => 'image/webp',
		'svg' => 'image/svg+xml',
		'mp4' => 'video/mp4',
		'webm' => 'video/webm',
		'mov' => 'video/quicktime',
		'pdf' => 'application/pdf',
		'csv' => 'text/csv',
		'json' => 'application/json',
		'md' => 'text/markdown',
		'txt' => 'text/plain',
		'doc' => 'application/msword',
		'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'xls' => 'application/vnd.ms-excel',
		'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'zip' => 'application/zip',
	];
}

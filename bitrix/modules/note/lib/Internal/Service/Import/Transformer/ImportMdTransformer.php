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

				$safeName = str_replace(['"', '}'], ['', ''], $file['name']);
				$attrs = sprintf(
					'{fileId=%d documentId=%d type="%s" name="%s" size=%d mimeType="%s"}',
					$file['fileId'],
					$documentId,
					$this->resolveType($file['mimeType']),
					$safeName,
					$file['size'],
					$file['mimeType'],
				);

				$linkPart = $matches['linkPart'];
				$url = $matches['url'];

				return $linkPart . '(' . $url . ')' . $attrs;
			},
			$markdown,
		);

		$result = $this->splitInlineAssets($result ?? $markdown);

		return new TransformResult($result, array_unique($fileIds));
	}

	/**
	 * Regex for enriched-asset syntax produced by transform():
	 *   !?[label](url){attrs}
	 *
	 * Assumes flat (non-nested) brackets/parens/braces — which is always the case
	 * for output of transform(): safeName strips '"' and '}', url comes from
	 * Outline's /api/attachments.redirect?id=... with no parens.
	 */
	private const ASSET_PATTERN = '/(?<raw>(?<bang>!?)\[(?<label>[^\]\n]*)\]\((?<url>[^)\n]+)\)\{(?<attrs>[^}\n]+)\})/';

	/**
	 * Ensures every enriched asset occupies its own line so the frontend
	 * block-level tokenizer recognises it. Preserves structural context:
	 * blockquote `>` prefixes and list-item indentation. Leaves fenced code
	 * blocks untouched.
	 */
	private function splitInlineAssets(string $markdown): string
	{
		if ($markdown === '' || !str_contains($markdown, '{'))
		{
			return $markdown;
		}

		$lines = explode("\n", $markdown);
		$out = [];
		$inFence = false;
		$fenceMarker = '';

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

			if (count($matches[0]) === 1 && trim($body) === $matches[0][0][0])
			{
				$out[] = $line;
				continue;
			}

			$segments = [];
			$lastEnd = 0;
			foreach ($matches[0] as $match)
			{
				[$rawAsset, $offset] = $match;
				$before = substr($body, $lastEnd, $offset - $lastEnd);
				$beforeTrim = trim($before);
				if ($beforeTrim !== '')
				{
					$segments[] = $beforeTrim;
				}
				$segments[] = $rawAsset;
				$lastEnd = $offset + strlen($rawAsset);
			}
			$tail = trim(substr($body, $lastEnd));
			if ($tail !== '')
			{
				$segments[] = $tail;
			}

			if (empty($segments))
			{
				$out[] = $line;
				continue;
			}

			$first = true;
			foreach ($segments as $segment)
			{
				if ($first)
				{
					$out[] = $prefixInfo['firstPrefix'] . $segment;
					$first = false;
					continue;
				}

				$out[] = $prefixInfo['blankPrefix'];
				$out[] = $prefixInfo['contPrefix'] . $segment;
			}
		}

		return implode("\n", $out);
	}

	/**
	 * Splits a line's leading structural prefix (blockquote chain + indent +
	 * list marker) from its content body. Returns prefixes used to emit
	 * subsequent split segments while preserving the original block context.
	 *
	 * @return array{prefixLen:int, firstPrefix:string, contPrefix:string, blankPrefix:string}
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
			'blankPrefix' => rtrim($bq),
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

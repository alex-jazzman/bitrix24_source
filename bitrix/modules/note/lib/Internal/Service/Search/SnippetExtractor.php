<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Search;

final class SnippetExtractor
{
	private const DEFAULT_MAX_LINES = 3;
	private const DEFAULT_LINE_MAX_LEN = 200;
	private const ELLIPSIS = '…';

	/**
	 * Builds an HTML-safe snippet for a search result.
	 *
	 * Behavior:
	 *  - The first line of $body is treated as the document title and skipped
	 *    (BODY is written as "title\n<stripped markdown>").
	 *  - Content lines are trimmed, empty ones are dropped.
	 *  - If any token matches, the window of $maxLines is built around the first
	 *    matched line (shifted to stay within bounds).
	 *  - If no token matches, the first $maxLines content lines are returned.
	 *  - Overly long lines are truncated with ellipses, centering on the match when
	 *    present.
	 *  - Output is HTML-escaped, then matched tokens are wrapped in <mark>.
	 *
	 * @param array<int|string> $tokens lowercase raw tokens (e.g. ['foo', 'bar']).
	 *                                  Numeric-looking tokens may arrive as int
	 *                                  (PHP key auto-cast) — coerced to string.
	 */
	/**
	 * Builds a plain-text preview (no token highlight, no HTML escape) for card-grid display.
	 * Skips the title line (BODY is "title\n<stripped>") and returns up to $maxLines content lines
	 * truncated to $lineMaxLen each, joined by "\n".
	 */
	public function extractPreview(
		string $body,
		int $maxLines = self::DEFAULT_MAX_LINES,
		int $lineMaxLen = self::DEFAULT_LINE_MAX_LEN,
	): string
	{
		if ($body === '' || $maxLines <= 0 || $lineMaxLen <= 0)
		{
			return '';
		}

		$newlinePos = strpos($body, "\n");
		if ($newlinePos === false)
		{
			return '';
		}

		$content = substr($body, $newlinePos + 1);
		$lines = [];
		foreach (explode("\n", $content) as $rawLine)
		{
			$trimmed = trim($rawLine);
			if ($trimmed !== '')
			{
				$lines[] = $trimmed;
			}
			if (count($lines) >= $maxLines)
			{
				break;
			}
		}

		if ($lines === [])
		{
			return '';
		}

		$truncated = array_map(
			function (string $line) use ($lineMaxLen): string {
				return mb_strlen($line) <= $lineMaxLen
					? $line
					: mb_substr($line, 0, $lineMaxLen) . self::ELLIPSIS;
			},
			$lines,
		);

		return implode("\n", $truncated);
	}

	public function extract(
		string $body,
		array $tokens,
		int $maxLines = self::DEFAULT_MAX_LINES,
		int $lineMaxLen = self::DEFAULT_LINE_MAX_LEN,
	): string
	{
		if ($body === '' || $maxLines <= 0 || $lineMaxLen <= 0)
		{
			return '';
		}

		$newlinePos = strpos($body, "\n");
		if ($newlinePos === false)
		{
			return '';
		}

		$content = substr($body, $newlinePos + 1);
		$lines = [];
		foreach (explode("\n", $content) as $rawLine)
		{
			$trimmed = trim($rawLine);
			if ($trimmed !== '')
			{
				$lines[] = $trimmed;
			}
		}

		if ($lines === [])
		{
			return '';
		}

		$cleanTokens = [];
		foreach ($tokens as $token)
		{
			$str = (string)$token;
			if ($str !== '')
			{
				$cleanTokens[] = $str;
			}
		}

		$matchIdx = $this->findMatchLineIndex($lines, $cleanTokens);

		if ($matchIdx === null)
		{
			$selected = array_slice($lines, 0, $maxLines);
			$escaped = array_map(
				fn (string $line): string => $this->truncateAndEscape($line, null, $lineMaxLen),
				$selected,
			);

			return implode("\n", $escaped);
		}

		[$start, $end] = $this->computeWindow($matchIdx, count($lines), $maxLines);
		$selected = array_slice($lines, $start, $end - $start + 1);

		$escapedLines = [];
		foreach ($selected as $line)
		{
			$matchPos = $this->findFirstMatchPos($line, $cleanTokens);
			$escapedLines[] = $this->truncateAndEscape($line, $matchPos, $lineMaxLen);
		}

		return $this->highlight(implode("\n", $escapedLines), $cleanTokens);
	}

	/**
	 * @param string[] $lines
	 * @param string[] $tokens
	 */
	private function findMatchLineIndex(array $lines, array $tokens): ?int
	{
		if ($tokens === [])
		{
			return null;
		}

		foreach ($lines as $idx => $line)
		{
			if ($this->findFirstMatchPos($line, $tokens) !== null)
			{
				return $idx;
			}
		}

		return null;
	}

	/**
	 * @param string[] $tokens
	 */
	private function findFirstMatchPos(string $line, array $tokens): ?int
	{
		$min = null;
		foreach ($tokens as $token)
		{
			$pos = mb_stripos($line, $token);
			if ($pos !== false && ($min === null || $pos < $min))
			{
				$min = $pos;
			}
		}

		return $min;
	}

	/**
	 * @return array{int, int} [start, end] line indices (inclusive).
	 */
	private function computeWindow(int $matchIdx, int $lineCount, int $maxLines): array
	{
		$half = intdiv($maxLines - 1, 2);
		$start = $matchIdx - $half;
		$end = $start + $maxLines - 1;

		if ($start < 0)
		{
			$end = min($lineCount - 1, $end - $start);
			$start = 0;
		}
		if ($end >= $lineCount)
		{
			$start = max(0, $start - ($end - $lineCount + 1));
			$end = $lineCount - 1;
		}

		return [$start, $end];
	}

	private function truncateAndEscape(string $line, ?int $matchPos, int $maxLen): string
	{
		$len = mb_strlen($line);
		if ($len <= $maxLen)
		{
			return htmlspecialcharsbx($line);
		}

		if ($matchPos === null)
		{
			$truncated = mb_substr($line, 0, $maxLen);

			return htmlspecialcharsbx($truncated) . self::ELLIPSIS;
		}

		$before = intdiv($maxLen, 3);
		$start = max(0, $matchPos - $before);
		$truncated = mb_substr($line, $start, $maxLen);
		$escaped = htmlspecialcharsbx($truncated);
		if ($start > 0)
		{
			$escaped = self::ELLIPSIS . $escaped;
		}
		if ($start + $maxLen < $len)
		{
			$escaped .= self::ELLIPSIS;
		}

		return $escaped;
	}

	/**
	 * @param string[] $tokens
	 */
	private function highlight(string $escapedText, array $tokens): string
	{
		if ($tokens === [])
		{
			return $escapedText;
		}

		$quoted = array_map(static fn (string $t): string => preg_quote($t, '/'), $tokens);
		$pattern = '/(' . implode('|', $quoted) . ')/iu';

		$result = preg_replace($pattern, '<mark>$1</mark>', $escapedText);

		return $result ?? $escapedText;
	}
}

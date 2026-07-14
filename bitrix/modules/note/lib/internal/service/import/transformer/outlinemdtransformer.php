<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

/**
 * Handles Outline API attachment format in markdown.
 *
 * Attachment patterns in documents.list response:
 *   ![label](/api/attachments.redirect?id=uuid)
 *   [file.pdf](/api/attachments.redirect?id=uuid)
 */
class OutlineMdTransformer extends ImportMdTransformer
{
	protected function getPattern(): string
	{
		return '/(?P<linkPart>!?\[[^\]]*\])\((?P<url>[^\)]*\/api\/attachments\.redirect\?id=(?P<attachmentId>[a-f0-9\-]+)[^\)]*)\)(?!\{)/i';
	}

	public function preprocessMarkdown(string $markdown): string
	{
		if ($markdown === '')
		{
			return $markdown;
		}

		$result = preg_replace_callback(
			'/```[\s\S]*?```|`[^`\n]+`|\\\\n/',
			static function (array $match): string {
				if ($match[0] === "\\n")
				{
					return "  \n";
				}

				return $match[0];
			},
			$markdown,
		) ?? $markdown;

		// Remove standalone \ on lines (Outline hard-break artifacts): "> \" → ">", "\" → ""
		$result = preg_replace('/^[ \t]*((?:>[ \t]*)*)\\\\[ \t]*$/m', '$1', $result);

		return $result;
	}
}

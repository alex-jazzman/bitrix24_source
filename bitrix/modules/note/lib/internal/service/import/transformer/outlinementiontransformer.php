<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

/**
 * Handles Outline link formats inside markdown:
 *   - @[label](mention://sessionUuid/{document|collection|user}/{uuid})
 *   - [label](/doc/{uuid|slug-urlId|bare-urlId}[/sub#frag?query])
 *   - [label](/collection/{uuid|slug-urlId|bare-urlId}[/sub#frag?query])
 *   - [label]({baseUrl}/doc/...) and [label]({baseUrl}/collection/...) — pre-normalized to relative form.
 *
 * Mention payloads always carry the UUID; plain links can carry any of the three id forms,
 * so plain-link lookups use both EXTERNAL_ID (UUID) and URL_ID (bare 10-char urlId).
 */
class OutlineMentionTransformer extends MentionTransformer
{
	private const PLAIN_LINK_PATTERN =
		'/\[(?P<label>[^\]]+)\]\(\/(?P<kind>doc|collection)\/(?P<externalId>[A-Za-z0-9_\-]+)(?:[\/#?][^\s)]*)?\)/i';

	protected function getPattern(): string
	{
		return '/@\[(?P<label>[^\]]+)\]\(mention:\/\/[^\/]+\/(?P<entityType>document|collection|user)\/(?P<externalId>[a-f0-9\-]+)\)/i';
	}

	protected function buildExternalDocumentLink(string $label, string $externalId): string
	{
		$baseUrl = rtrim($this->sourceUrl, '/');

		return "[{$label}]({$baseUrl}/doc/{$externalId})";
	}

	protected function buildExternalCollectionLink(string $label, string $externalId): string
	{
		$baseUrl = rtrim($this->sourceUrl, '/');

		return "[{$label}]({$baseUrl}/collection/{$externalId})";
	}

	protected function extractUrlId(string $raw): ?string
	{
		return OutlineIdNormalizer::extractUrlId($raw);
	}

	protected function normalizeUnresolvedId(string $externalId): string
	{
		return OutlineIdNormalizer::extractUrlId($externalId) ?? $externalId;
	}

	protected function extractMentionedExternalIds(string $markdown): array
	{
		$normalized = $this->normalizeAbsoluteLinks($markdown);
		$ids = parent::extractMentionedExternalIds($normalized);

		if (preg_match_all(self::PLAIN_LINK_PATTERN, $normalized, $matches))
		{
			$ids = array_merge($ids, $matches['externalId'] ?? []);
		}

		return $ids;
	}

	public function transform(string $markdown): MentionTransformResult
	{
		$markdown = $this->normalizeAbsoluteLinks($markdown);

		$result = parent::transform($markdown);
		$unresolvedIds = $result->unresolvedIds;

		$transformed = preg_replace_callback(
			self::PLAIN_LINK_PATTERN,
			function (array $m) use (&$unresolvedIds): string {
				$label = $m['label'];
				$externalId = $m['externalId'];
				$kind = strtolower($m['kind']);

				if ($kind === 'doc')
				{
					return $this->resolveDocument($label, $externalId, $unresolvedIds);
				}

				return $this->resolveCollection($label, $externalId, $unresolvedIds);
			},
			$result->markdown,
		);

		return new MentionTransformResult($transformed ?? $result->markdown, $unresolvedIds);
	}

	/**
	 * Rewrites `]({baseUrl}/doc/...)` and `]({baseUrl}/collection/...)` to relative form
	 * so a single plain-link regex can handle both relative and absolute URLs.
	 * Covers http<->https swap; trailing slash on baseUrl is already trimmed.
	 * Only touches the link target part `](...)`, never the link label or surrounding prose.
	 */
	private function normalizeAbsoluteLinks(string $markdown): string
	{
		$baseUrl = rtrim($this->sourceUrl, '/');
		if ($baseUrl === '')
		{
			return $markdown;
		}

		$variants = [$baseUrl];
		if (str_starts_with($baseUrl, 'https://'))
		{
			$variants[] = 'http://' . substr($baseUrl, 8);
		}
		elseif (str_starts_with($baseUrl, 'http://'))
		{
			$variants[] = 'https://' . substr($baseUrl, 7);
		}

		foreach ($variants as $variant)
		{
			$markdown = str_replace(
				["]({$variant}/doc/", "]({$variant}/collection/"],
				['](/doc/', '](/collection/'],
				$markdown,
			);
		}

		return $markdown;
	}
}

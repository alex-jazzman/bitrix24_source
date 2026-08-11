<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

/**
 * Resolves wiki internal-link markers emitted by WikiMarkupConverter (ALG-01):
 *   [label](wiki-mention://{percent-encoded externalId})
 *
 * The external id ({collectionId}#{NAME}, see WikiId) is percent-encoded inside
 * the marker so it survives markdown/regex intact; it is decoded before lookup.
 * All wiki internal links target pages (documents) — there is no collection
 * mention — so every match resolves as a document.
 *
 * Fallback for a not-yet-imported target is `[label](/doc/{externalId})`. With
 * sourceUrl = '' that is exactly what MentionReconciler reconstructs
 * ("{baseUrl}/doc/{externalId}") and str_replaces once the target appears.
 */
class WikiMentionTransformer extends MentionTransformer
{
	protected function getPattern(): string
	{
		return '/\[(?P<label>[^\]\n]*)\]\(wiki-mention:\/\/(?P<token>[^)\s]+)\)/u';
	}

	protected function extractMentionedExternalIds(string $markdown): array
	{
		if (!preg_match_all($this->getPattern(), $markdown, $matches))
		{
			return [];
		}

		return array_map(
			static fn (string $token): string => rawurldecode($token),
			$matches['token'] ?? [],
		);
	}

	public function transform(string $markdown): MentionTransformResult
	{
		$unresolvedIds = [];

		$result = preg_replace_callback($this->getPattern(), function (array $m) use (&$unresolvedIds): string {
			$label = $m['label'];
			$externalId = rawurldecode($m['token']);

			return $this->resolveDocument($label, $externalId, $unresolvedIds);
		}, $markdown);

		return new MentionTransformResult($result ?? $markdown, $unresolvedIds);
	}

	protected function buildExternalDocumentLink(string $label, string $externalId): string
	{
		// sourceUrl is empty for wiki, so MentionReconciler rebuilds "/doc/{externalId}".
		$baseUrl = rtrim($this->sourceUrl, '/');

		return "[{$label}]({$baseUrl}/doc/{$externalId})";
	}

	protected function buildExternalCollectionLink(string $label, string $externalId): string
	{
		$baseUrl = rtrim($this->sourceUrl, '/');

		return "[{$label}]({$baseUrl}/collection/{$externalId})";
	}
}

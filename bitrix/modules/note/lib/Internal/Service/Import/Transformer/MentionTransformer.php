<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Transformer;

use Bitrix\Note\Internal\Repository\ImportMapRepository;

abstract class MentionTransformer
{
	private array $resolvedCache = [];

	public function __construct(
		protected readonly ImportMapRepository $mapRepository,
		protected readonly string $sourceType,
		protected readonly string $sourceUrl,
	)
	{
	}

	/**
	 * Returns regex pattern to match mention links in markdown.
	 * Pattern MUST define named groups: 'label', 'entityType' (document|collection|user), 'externalId'.
	 */
	abstract protected function getPattern(): string;

	/**
	 * Builds a fallback external link for an unresolved document mention.
	 */
	abstract protected function buildExternalDocumentLink(string $label, string $externalId): string;

	/**
	 * Builds a fallback external link for an unresolved collection mention.
	 */
	abstract protected function buildExternalCollectionLink(string $label, string $externalId): string;

	/**
	 * Source-specific hook: when the raw markdown identifier is not a UUID
	 * (i.e. should be matched against import_map.URL_ID rather than EXTERNAL_ID),
	 * return the bare urlId form here. Default: source has no urlId concept.
	 */
	protected function extractUrlId(string $raw): ?string
	{
		return null;
	}

	/**
	 * Source-specific hook applied to the raw identifier before it's persisted
	 * as an unresolved mention and embedded into the fallback external link.
	 * Default: identity. Outline returns the bare 10-char urlId so the value
	 * fits b_note_unresolved_mention.EXTERNAL_ID (VARCHAR(128)) regardless of
	 * the original slug length, and the fallback link/EXTERNAL_ID stay in sync
	 * for MentionReconciler's str_replace.
	 */
	protected function normalizeUnresolvedId(string $externalId): string
	{
		return $externalId;
	}

	/**
	 * @param string[] $markdowns
	 */
	public function preload(array $markdowns): void
	{
		$ids = [];
		foreach ($markdowns as $markdown)
		{
			if (!is_string($markdown) || $markdown === '')
			{
				continue;
			}
			foreach ($this->extractMentionedExternalIds($markdown) as $id)
			{
				$ids[$id] = true;
			}
		}

		$newIds = array_diff(array_keys($ids), array_keys($this->resolvedCache));
		if (empty($newIds))
		{
			return;
		}

		$urlIds = [];
		$rawToUrlId = [];
		foreach ($newIds as $id)
		{
			$urlId = $this->extractUrlId($id);
			if ($urlId !== null)
			{
				$urlIds[] = $urlId;
				$rawToUrlId[$id] = $urlId;
			}
		}

		$mappings = $this->mapRepository->bulkLookup($this->sourceType, $newIds, $urlIds);
		foreach ($newIds as $id)
		{
			$entry = $mappings[$id] ?? null;
			if ($entry === null && isset($rawToUrlId[$id]))
			{
				$entry = $mappings[$rawToUrlId[$id]] ?? null;
			}
			$this->resolvedCache[$id] = $entry ?? ['documentId' => null, 'collectionId' => null];
		}
	}

	/**
	 * @return string[]
	 */
	protected function extractMentionedExternalIds(string $markdown): array
	{
		if (!preg_match_all($this->getPattern(), $markdown, $matches))
		{
			return [];
		}

		return $matches['externalId'] ?? [];
	}

	public function transform(string $markdown): MentionTransformResult
	{
		$unresolvedIds = [];

		$result = preg_replace_callback($this->getPattern(), function (array $m) use (&$unresolvedIds): string {
			$label = $m['label'];
			$entityType = $m['entityType'];
			$externalId = $m['externalId'];

			return match ($entityType)
			{
				'document' => $this->resolveDocument($label, $externalId, $unresolvedIds),
				'collection' => $this->resolveCollection($label, $externalId, $unresolvedIds),
				'user' => $label,
				default => $m[0],
			};
		}, $markdown);

		return new MentionTransformResult($result ?? $markdown, $unresolvedIds);
	}

	protected function resolveDocument(string $label, string $externalId, array &$unresolvedIds): string
	{
		$docId = $this->lookupDocumentId($externalId);
		if ($docId !== null)
		{
			return "[{$label}](/note/document/{$docId}/)";
		}

		$normalizedId = $this->normalizeUnresolvedId($externalId);
		$unresolvedIds[] = $normalizedId;

		return $this->buildExternalDocumentLink($label, $normalizedId);
	}

	protected function resolveCollection(string $label, string $externalId, array &$unresolvedIds): string
	{
		$colId = $this->lookupCollectionId($externalId);
		if ($colId !== null)
		{
			return "[{$label}](/note/workspace/{$colId}/)";
		}

		$normalizedId = $this->normalizeUnresolvedId($externalId);
		$unresolvedIds[] = $normalizedId;

		return $this->buildExternalCollectionLink($label, $normalizedId);
	}

	protected function lookupDocumentId(string $externalId): ?int
	{
		if (array_key_exists($externalId, $this->resolvedCache))
		{
			return $this->resolvedCache[$externalId]['documentId'];
		}

		// Fallback на одиночный запрос для вызовов без preload (напр. в тестах).
		$docId = $this->mapRepository->findDocumentId($this->sourceType, $externalId);
		if ($docId === null)
		{
			$urlId = $this->extractUrlId($externalId);
			if ($urlId !== null && $urlId !== $externalId)
			{
				$docId = $this->mapRepository->findDocumentId($this->sourceType, $urlId);
			}
		}
		$this->resolvedCache[$externalId] = ['documentId' => $docId, 'collectionId' => null];

		return $docId;
	}

	protected function lookupCollectionId(string $externalId): ?int
	{
		if (array_key_exists($externalId, $this->resolvedCache))
		{
			return $this->resolvedCache[$externalId]['collectionId'];
		}

		$colId = $this->mapRepository->findCollectionId($this->sourceType, $externalId);
		if ($colId === null)
		{
			$urlId = $this->extractUrlId($externalId);
			if ($urlId !== null && $urlId !== $externalId)
			{
				$colId = $this->mapRepository->findCollectionId($this->sourceType, $urlId);
			}
		}
		$this->resolvedCache[$externalId] = ['documentId' => null, 'collectionId' => $colId];

		return $colId;
	}
}

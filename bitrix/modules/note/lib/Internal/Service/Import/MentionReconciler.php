<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\Import\Transformer\OutlineIdNormalizer;

class MentionReconciler
{
	public function __construct(
		private readonly UnresolvedMentionService $unresolvedMentionService,
		private readonly DocumentService $documentService,
		private readonly string $sourceUrl,
	)
	{
	}

	/**
	 * Resolves previously unresolved mentions that now have mappings.
	 * Returns the number of resolved mentions.
	 */
	public function reconcile(string $sourceType, int $batchSize = 50): int
	{
		$resolvable = $this->unresolvedMentionService->findResolvable(
			$sourceType,
			$batchSize,
			self::resolveUrlIdExtractor($sourceType),
		);

		self::logInfo('reconciler: found ' . count($resolvable) . ' resolvable mentions');

		if (empty($resolvable))
		{
			return 0;
		}

		$resolvedIds = [];
		$documentUpdates = [];

		foreach ($resolvable as $row)
		{
			$docId = $row['DOCUMENT_ID'];
			$externalId = $row['EXTERNAL_ID'];

			if (!isset($documentUpdates[$docId]))
			{
				$documentUpdates[$docId] = [];
			}

			$documentUpdates[$docId][] = [
				'externalId' => $externalId,
				'targetDocId' => $row['TARGET_DOCUMENT_ID'] ?? null,
				'targetCollectionId' => $row['TARGET_COLLECTION_ID'] ?? null,
			];

			$resolvedIds[] = $row['ID'];
		}

		$baseUrl = rtrim($this->sourceUrl, '/');

		$docIds = array_keys($documentUpdates);
		$markdownById = [];
		foreach ($this->documentService->findByIds($docIds, ['ID', 'MARKDOWN']) as $id => $row)
		{
			$markdownById[$id] = $row['MARKDOWN'];
		}

		foreach ($documentUpdates as $docId => $replacements)
		{
			$markdown = $markdownById[$docId] ?? null;
			if (!is_string($markdown) || $markdown === '')
			{
				continue;
			}

			$changed = false;
			foreach ($replacements as $replacement)
			{
				$externalId = $replacement['externalId'];

				if ($replacement['targetDocId'] !== null)
				{
					$externalLink = "{$baseUrl}/doc/{$externalId}";
					$internalLink = "/note/document/{$replacement['targetDocId']}/";
				}
				elseif ($replacement['targetCollectionId'] !== null)
				{
					$externalLink = "{$baseUrl}/collection/{$externalId}";
					$internalLink = "/note/collection/{$replacement['targetCollectionId']}/";
				}
				else
				{
					continue;
				}

				if (str_contains($markdown, $externalLink))
				{
					$markdown = str_replace($externalLink, $internalLink, $markdown);
					$changed = true;
					self::logInfo("reconciler: replaced {$externalLink} → {$internalLink} in doc {$docId}");
				}
			}

			if ($changed)
			{
				$this->documentService->setMarkdown($docId, $markdown);
			}
		}

		$this->unresolvedMentionService->deleteByIds($resolvedIds);

		return count($resolvedIds);
	}

	/**
	 * @return ?callable(string):?string
	 */
	private static function resolveUrlIdExtractor(string $sourceType): ?callable
	{
		return match ($sourceType)
		{
			'outline' => [OutlineIdNormalizer::class, 'extractUrlId'],
			default => null,
		};
	}

	private static function logInfo(string $message): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_DEBUG,
			'AUDIT_TYPE_ID' => 'IMPORT_DEBUG',
			'MODULE_ID' => 'note',
			'DESCRIPTION' => $message,
		]);
	}
}

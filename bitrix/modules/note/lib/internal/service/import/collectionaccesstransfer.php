<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;

/**
 * Transfers the source collection's access control to the freshly created note
 * collection. Invoked from CreateCollectionStep once the collection exists.
 *
 * Access transfer is best-effort: any failure is logged but never aborts the
 * import (the collection just keeps its default private ACL). The source returns
 * positive grants as Bitrix access codes (e.g. SG{id}_K, G{id}) plus a '*' policy
 * level; the importer is always kept as a moderator so the collection satisfies
 * the "at least one moderator" invariant and whoever ran the migration keeps
 * control. Sources without source-side permissions (Outline) return an empty
 * list, leaving the default ACL untouched.
 */
class CollectionAccessTransfer
{
	public function apply(array $option, ?SourceInterface $source): void
	{
		$collectionId = (int)($option['resultCollectionId'] ?? 0);
		$userId = (int)($option['userId'] ?? 0);
		if ($collectionId <= 0 || $userId <= 0 || $source === null)
		{
			return;
		}

		$collectionIds = $option['collectionIds'] ?? [];
		$collectionIndex = $option['collectionIndex'] ?? 0;
		$sourceCollectionId = (string)($collectionIds[$collectionIndex] ?? '');
		if ($sourceCollectionId === '')
		{
			return;
		}

		$result = $source->getCollectionAccess($sourceCollectionId);
		if (!$result->success)
		{
			ImportLogger::logInfo("collectionAccess: source returned no access for {$sourceCollectionId}");

			return;
		}

		$permissions = $result->data['permissions'] ?? [];
		if (empty($permissions))
		{
			// Nothing to transfer (e.g. Outline) — keep the default private ACL.
			return;
		}

		// The importer must stay a moderator: replaceCollectionPermissions requires
		// at least one moderator, and the importer owns the migrated collection.
		$permissions[] = [
			'subjectCode' => 'U' . $userId,
			'level' => CollectionAccessService::LEVEL_CODE_MODERATE,
		];

		$policyLevel = $result->data['policyLevel'] ?? CollectionAccessService::LEVEL_CODE_NONE;

		$applyResult = CollectionAccessService::replaceCollectionPermissions(
			$collectionId,
			$permissions,
			$userId,
			$policyLevel,
		);

		if (!$applyResult->isSuccess())
		{
			ImportLogger::logError(
				"collectionAccess: failed for collection {$collectionId}: "
				. implode('; ', $applyResult->getErrorMessages())
			);

			return;
		}

		ImportLogger::logInfo(
			'collectionAccess: applied ' . count($permissions) . " grants to collection {$collectionId}"
		);
	}
}

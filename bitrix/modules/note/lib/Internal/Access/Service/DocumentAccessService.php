<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Service;

use Bitrix\Main\Access\AccessCode;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;
use Bitrix\Note\Internal\Access\PortalAdmin;
use Bitrix\Note\Internal\Entity\RecycleBin\RecycleBinRecord;
use Bitrix\Note\Internal\Model\CollectionTable;
use Bitrix\Note\Internal\Model\DocumentAccessTable;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;

final class DocumentAccessService
{
	public const LEVEL_NONE = 0;
	public const LEVEL_VIEW = 10;
	public const LEVEL_EDIT = 20;
	public const LEVEL_CODE_NONE = 'none';
	public const LEVEL_CODE_VIEW = 'view';
	public const LEVEL_CODE_EDIT = 'edit';

	private const ALLOWED_LEVELS = [self::LEVEL_NONE, self::LEVEL_VIEW, self::LEVEL_EDIT];

	private static ?array $userHasAnyGrantCache = null;

	public static function normalizeLevel(string|int|null $level): int
	{
		if (is_int($level))
		{
			return in_array($level, self::ALLOWED_LEVELS, true) ? $level : self::LEVEL_NONE;
		}

		if (is_string($level) && is_numeric($level))
		{
			return self::normalizeLevel((int)$level);
		}

		$normalized = mb_strtolower(trim((string)$level));

		return match ($normalized)
		{
			self::LEVEL_CODE_VIEW => self::LEVEL_VIEW,
			self::LEVEL_CODE_EDIT => self::LEVEL_EDIT,
			default => self::LEVEL_NONE,
		};
	}

	public static function levelToCode(int $level): string
	{
		return match ($level)
		{
			self::LEVEL_VIEW => self::LEVEL_CODE_VIEW,
			self::LEVEL_EDIT => self::LEVEL_CODE_EDIT,
			default => self::LEVEL_CODE_NONE,
		};
	}

	public static function getDocumentLevel(int $documentId, int $userId, array $accessCodes): int
	{
		if ($documentId <= 0 || $userId <= 0)
		{
			return self::LEVEL_NONE;
		}

		$codes = array_values(array_unique(array_filter([
			...$accessCodes,
			'U' . $userId,
		], static fn($code) => is_string($code) && $code !== '' && $code !== '*')));

		$query = DocumentAccessTable::query()
			->setSelect(['LEVEL'])
			->where('DOCUMENT_ID', $documentId)
			->whereIn('SUBJECT_CODE', $codes)
			->exec()
		;

		$personalLevel = null;
		$personalDeny = false;
		while ($row = $query->fetch())
		{
			$level = (int)$row['LEVEL'];
			if ($level === self::LEVEL_NONE)
			{
				$personalDeny = true;
			}
			else
			{
				$personalLevel = max($personalLevel ?? self::LEVEL_NONE, $level);
			}
		}

		if ($personalDeny)
		{
			return self::LEVEL_NONE;
		}

		return $personalLevel ?? self::LEVEL_NONE;
	}

	public static function getEffectiveLevel(int $documentId, int $collectionId, int $userId, array $accessCodes): int
	{
		$levels = self::getAccessLevels($documentId, $collectionId, $userId, $accessCodes);

		return max($levels['collection'], $levels['document']);
	}

	/**
	 * Returns the (collection, document) pair of raw levels for a single user in one
	 * shot: two SELECTs (collection_access + document_access). Used where a caller
	 * needs both axes (e.g. effective `max()` plus `sharedAccess = col < VIEW`) and
	 * does not want to re-query the same rows twice.
	 *
	 * @return array{collection: int, document: int}
	 */
	public static function getAccessLevels(int $documentId, int $collectionId, int $userId, array $accessCodes): array
	{
		$collectionLevel = $collectionId > 0
			? CollectionAccessService::getUserLevel($collectionId, $userId, $accessCodes)
			: self::LEVEL_NONE;

		$documentLevel = self::getDocumentLevel($documentId, $userId, $accessCodes);

		return [
			'collection' => $collectionLevel,
			'document' => $documentLevel,
		];
	}

	/**
	 * Single-shot ACL snapshot for the current user against a (doc, col) pair.
	 * Costs at most two SELECTs (collection_access + document_access) for non-admins,
	 * and zero queries for admins / anonymous. Reuse it whenever a single request path
	 * needs several derived flags for the same document — avoids running multiple
	 * independent currentUserHasLevel checks against the same rows.
	 *
	 * Field semantics:
	 *  - canViewCollection / canEditCollection — strictly the collection-level
	 *    grants of the viewer. Use for tree/manage decisions.
	 *  - canManagePermissions — viewer has MODERATE on the collection.
	 *  - canView / canEdit — effective grants on the document
	 *    (max(collection, document)). Use for read/write of the document itself.
	 *  - sharedAccess — true when the viewer has no collection VIEW; the document is
	 *    reachable only via a document-level grant.
	 *
	 * @return array{
	 *   canViewCollection: bool,
	 *   canEditCollection: bool,
	 *   canManagePermissions: bool,
	 *   canView: bool,
	 *   canEdit: bool,
	 *   sharedAccess: bool,
	 * }
	 */
	public static function getCurrentUserSnapshot(int $documentId, int $collectionId, bool $isArchived = false): array
	{
		if (PortalAdmin::isCurrentUserAdmin())
		{
			return [
				'canViewCollection' => true,
				'canEditCollection' => true,
				'canManagePermissions' => true,
				'canView' => true,
				'canEdit' => !$isArchived,
				'sharedAccess' => false,
			];
		}

		$userId = (int)CurrentUser::get()->getId();
		if ($userId <= 0 || $documentId <= 0 || $collectionId <= 0)
		{
			return [
				'canViewCollection' => false,
				'canEditCollection' => false,
				'canManagePermissions' => false,
				'canView' => false,
				'canEdit' => false,
				'sharedAccess' => true,
			];
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		$levels = self::getAccessLevels($documentId, $collectionId, $userId, $accessCodes);
		$effective = max($levels['collection'], $levels['document']);

		return [
			'canViewCollection' => $levels['collection'] >= CollectionAccessService::LEVEL_VIEW,
			'canEditCollection' => $levels['collection'] >= CollectionAccessService::LEVEL_MANAGE,
			'canManagePermissions' => $levels['collection'] >= CollectionAccessService::LEVEL_MODERATE,
			'canView' => $effective >= self::LEVEL_VIEW,
			'canEdit' => !$isArchived && $effective >= self::LEVEL_EDIT,
			'sharedAccess' => $levels['collection'] < CollectionAccessService::LEVEL_VIEW,
		];
	}

	public static function currentUserHasLevel(int $documentId, int $collectionId, int $requiredLevel): bool
	{
		if ($requiredLevel <= self::LEVEL_NONE)
		{
			return true;
		}

		$userId = (int)CurrentUser::get()->getId();

		if ($userId <= 0 || $documentId <= 0)
		{
			return false;
		}

		if (PortalAdmin::isCurrentUserAdmin())
		{
			return true;
		}

		$accessCodes = self::getCurrentUserAccessCodes($userId);

		return self::getEffectiveLevel($documentId, $collectionId, $userId, $accessCodes) >= $requiredLevel;
	}

	public static function replaceDocumentPermissions(
		int $documentId,
		array $permissions,
		int $actorId,
		?PushNotificationService $pushService = null
	): Result
	{
		$result = new Result();
		if ($documentId <= 0)
		{
			$result->addError(new \Bitrix\Main\Error('Invalid document id'));

			return $result;
		}

		$hadAclBefore = self::hasAnyAclRow($documentId);
		$prepared = [];

		foreach ($permissions as $permission)
		{
			$subjectCode = (string)($permission['subjectCode'] ?? '');
			$level = self::normalizeLevel($permission['level'] ?? self::LEVEL_NONE);

			if ($subjectCode === '*' || !AccessCode::isValid($subjectCode))
			{
				continue;
			}

			$prepared[$subjectCode] = [
				'DOCUMENT_ID' => $documentId,
				'SUBJECT_CODE' => $subjectCode,
				'LEVEL' => $level,
				'CREATED_BY' => $actorId,
			];
		}

		$connection = Application::getConnection();
		$connection->startTransaction();
		$committed = false;
		try
		{
			$deleteResult = self::deleteByDocumentId($documentId);
			if (!$deleteResult->isSuccess())
			{
				$result->addErrors($deleteResult->getErrors());
				$connection->rollbackTransaction();

				return $result;
			}

			if (!empty($prepared))
			{
				$sqlHelper = $connection->getSqlHelper();
				$values = [];
				foreach ($prepared as $row)
				{
					$values[] = sprintf(
						"(%s, %d, '%s', %d, %d)",
						$sqlHelper->convertToDbDateTime(new \Bitrix\Main\Type\DateTime()),
						$documentId,
						$sqlHelper->forSql((string)$row['SUBJECT_CODE']),
						(int)$row['LEVEL'],
						(int)$row['CREATED_BY'],
					);
				}

				$connection->queryExecute(
					'INSERT INTO b_note_document_access'
					. ' (CREATED_AT, DOCUMENT_ID, SUBJECT_CODE, LEVEL, CREATED_BY) VALUES '
					. implode(', ', $values)
				);
			}

			$connection->commitTransaction();
			$committed = true;
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();
			$result->addError(new \Bitrix\Main\Error($e->getMessage()));
		}

		self::$userHasAnyGrantCache = null;

		if ($committed)
		{
			$hasAclAfter = $prepared !== [];
			if ($hadAclBefore || $hasAclAfter)
			{
				// Skip emission only when both sides are empty (nothing changed, no subscribers cared).
				self::dispatchDocumentCapabilities($documentId, $pushService);
			}
		}

		return $result;
	}

	private static function hasAnyAclRow(int $documentId): bool
	{
		if ($documentId <= 0)
		{
			return false;
		}

		$row = DocumentAccessTable::query()
			->setSelect(['ID'])
			->where('DOCUMENT_ID', $documentId)
			->setLimit(1)
			->exec()
			->fetch()
		;

		return $row !== false;
	}

	private static function dispatchDocumentCapabilities(int $documentId, ?PushNotificationService $pushService): void
	{
		if (Option::get('note', 'phase4_broadcast_enabled', 'Y') !== 'Y')
		{
			return;
		}

		$push = $pushService ?? new PushNotificationService();
		$push->dispatchAfterCommit(static function () use ($push, $documentId): void {
			$push->sendByTag(
				'NOTE_DOC_' . $documentId . '_ACL',
				'documentCapabilities',
				['documentId' => $documentId],
			);
		});
	}

	public static function getDocumentPermissions(int $documentId): array
	{
		if ($documentId <= 0)
		{
			return [];
		}

		$accessItems = DocumentAccessTable::getList([
			'select' => ['SUBJECT_CODE', 'LEVEL'],
			'filter' => [
				'=DOCUMENT_ID' => $documentId,
				'!=SUBJECT_CODE' => '*',
			],
			'order' => ['SUBJECT_CODE' => 'ASC'],
		])->fetchCollection();

		return array_map(static fn($item): array => [
			'subjectCode' => (string)$item->getSubjectCode(),
			'level' => self::levelToCode((int)$item->getLevel()),
		], $accessItems->getAll());
	}

	/**
	 * @param array<int, array{id: int, collectionId: int}> $documents
	 * @return array<int, int> documentId => effective level
	 */
	public static function batchGetEffectiveLevels(array $documents, array $accessCodes, ?int $userId): array
	{
		if (empty($documents))
		{
			return [];
		}

		$userId = (int)$userId;
		$documentIds = [];
		$collectionIds = [];
		foreach ($documents as $doc)
		{
			$docId = (int)($doc['id'] ?? 0);
			$colId = (int)($doc['collectionId'] ?? 0);
			if ($docId <= 0)
			{
				continue;
			}
			$documentIds[] = $docId;
			if ($colId > 0)
			{
				$collectionIds[$colId] = true;
			}
		}

		if (empty($documentIds))
		{
			return [];
		}

		$codes = array_values(array_unique(array_filter([
			...$accessCodes,
			$userId > 0 ? ('U' . $userId) : null,
		], static fn($code) => is_string($code) && $code !== '' && $code !== '*')));

		$documentLevels = [];
		if (!empty($codes))
		{
			$query = DocumentAccessTable::query()
				->setSelect(['DOCUMENT_ID', 'LEVEL'])
				->whereIn('DOCUMENT_ID', $documentIds)
				->whereIn('SUBJECT_CODE', $codes)
				->exec()
			;

			$personal = [];
			$deny = [];
			while ($row = $query->fetch())
			{
				$docId = (int)$row['DOCUMENT_ID'];
				$level = (int)$row['LEVEL'];
				if ($level === self::LEVEL_NONE)
				{
					$deny[$docId] = true;
				}
				else
				{
					$personal[$docId] = max($personal[$docId] ?? self::LEVEL_NONE, $level);
				}
			}

			foreach ($documentIds as $docId)
			{
				if (!empty($deny[$docId]))
				{
					$documentLevels[$docId] = self::LEVEL_NONE;
				}
				else
				{
					$documentLevels[$docId] = $personal[$docId] ?? self::LEVEL_NONE;
				}
			}
		}

		$collectionLevels = [];
		if (!empty($collectionIds) && !empty($accessCodes))
		{
			$collectionLevels = CollectionAccessService::batchGetUserLevels(
				array_keys($collectionIds),
				array_values(array_unique([...$accessCodes, '*'])),
			);
		}

		$result = [];
		foreach ($documents as $doc)
		{
			$docId = (int)($doc['id'] ?? 0);
			$colId = (int)($doc['collectionId'] ?? 0);
			if ($docId <= 0)
			{
				continue;
			}
			$docLevel = $documentLevels[$docId] ?? self::LEVEL_NONE;
			$colLevel = $collectionLevels[$colId] ?? self::LEVEL_NONE;
			$result[$docId] = max($docLevel, $colLevel);
		}

		return $result;
	}

	public static function deleteByDocumentId(int $documentId): Result
	{
		$result = new Result();

		if ($documentId <= 0)
		{
			return $result;
		}

		DocumentAccessTable::deleteByFilter(['=DOCUMENT_ID' => $documentId]);
		self::$userHasAnyGrantCache = null;

		return $result;
	}

	/**
	 * @param int[] $documentIds
	 */
	public static function deleteByDocumentIds(array $documentIds): void
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalized))
		{
			return;
		}

		DocumentAccessTable::deleteByFilter(['=DOCUMENT_ID' => $normalized]);
		self::$userHasAnyGrantCache = null;
	}

	public static function userHasAnyGrant(array $accessCodes): bool
	{
		$codes = array_values(array_unique(array_filter(
			$accessCodes,
			static fn($code) => is_string($code) && $code !== '' && $code !== '*',
		)));

		if (empty($codes))
		{
			return false;
		}

		$cacheKey = implode('|', $codes);
		if (isset(self::$userHasAnyGrantCache[$cacheKey]))
		{
			return self::$userHasAnyGrantCache[$cacheKey];
		}

		$row = DocumentAccessTable::query()
			->setSelect(['ID'])
			->whereIn('SUBJECT_CODE', $codes)
			->where('LEVEL', '>=', self::LEVEL_VIEW)
			->setLimit(1)
			->fetch()
		;

		$has = $row !== false;

		if (self::$userHasAnyGrantCache === null)
		{
			self::$userHasAnyGrantCache = [];
		}
		self::$userHasAnyGrantCache[$cacheKey] = $has;

		return $has;
	}

	public static function clearRequestCache(): void
	{
		self::$userHasAnyGrantCache = null;
	}

	/**
	 * Returns ids of documents accessible to the user purely via document-level grants
	 * (no collection-level VIEW or higher), ordered by ID DESC for cursor pagination.
	 *
	 * @param array<int, string> $accessCodes
	 * @param array{id: int}|null $afterCursor
	 * @return array{ids: int[], nextCursor: array{id: int}|null}
	 */
	public static function listSharedWithMeIds(array $accessCodes, int $limit, ?array $afterCursor = null): array
	{
		// A portal administrator sees every collection in full, so the "shared with me"
		// section (document-level grants only) is empty for them.
		if (PortalAdmin::isCurrentUserAdmin())
		{
			return ['ids' => [], 'nextCursor' => null];
		}

		$limit = max(1, min(200, $limit));

		$codesPersonal = array_values(array_unique(array_filter(
			$accessCodes,
			static fn($code) => is_string($code) && $code !== '' && $code !== '*',
		)));

		if (empty($codesPersonal))
		{
			return ['ids' => [], 'nextCursor' => null];
		}

		$collectionLevels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];
		$accessibleCollectionIds = [];
		foreach ($collectionLevels as $cid => $level)
		{
			if ((int)$level >= CollectionAccessService::LEVEL_VIEW)
			{
				$accessibleCollectionIds[] = (int)$cid;
			}
		}

		$connection = Application::getConnection();
		$sqlHelper = $connection->getSqlHelper();

		$quotedPersonal = implode(', ', array_map(
			static fn(string $code): string => "'" . $sqlHelper->forSql($code) . "'",
			$codesPersonal,
		));

		$whereParts = [
			"d.IS_ARCHIVED = 'N'",
			"EXISTS (SELECT 1 FROM b_note_document_access da_pos"
				. " WHERE da_pos.DOCUMENT_ID = d.ID"
				. " AND da_pos.SUBJECT_CODE IN ({$quotedPersonal})"
				. " AND da_pos.LEVEL >= " . self::LEVEL_VIEW . ")",
			"NOT EXISTS (SELECT 1 FROM b_note_document_access da_neg"
				. " WHERE da_neg.DOCUMENT_ID = d.ID"
				. " AND da_neg.SUBJECT_CODE IN ({$quotedPersonal})"
				. " AND da_neg.LEVEL = " . self::LEVEL_NONE . ")",
		];

		if (!empty($accessibleCollectionIds))
		{
			$ids = implode(', ', array_map(static fn($id): int => (int)$id, $accessibleCollectionIds));
			$whereParts[] = "d.COLLECTION_ID NOT IN ({$ids})";
		}

		$afterId = isset($afterCursor['id']) ? (int)$afterCursor['id'] : 0;
		if ($afterId > 0)
		{
			$whereParts[] = "d.ID < {$afterId}";
		}

		$where = implode(' AND ', $whereParts);
		$fetchLimit = $limit + 1;

		$sql = "SELECT d.ID FROM b_note_document d WHERE {$where} ORDER BY d.ID DESC LIMIT {$fetchLimit}";

		$result = $connection->query($sql);
		$ids = [];
		while ($row = $result->fetch())
		{
			$ids[] = (int)$row['ID'];
		}

		$nextCursor = null;
		if (count($ids) > $limit)
		{
			$ids = array_slice($ids, 0, $limit);
			$nextCursor = ['id' => end($ids)];
		}

		return ['ids' => $ids, 'nextCursor' => $nextCursor];
	}

	/**
	 * Returns ids of archived documents accessible to the user via either collection-VIEW
	 * or a document-level grant; respects NONE-overrides on the document.
	 * Ordered by (ARCHIVED_AT DESC, ID DESC) using a composite cursor.
	 *
	 * @param array<int, string> $accessCodes
	 * @param array{archivedAt: string, id: int}|null $afterCursor
	 * @return array{ids: int[], nextCursor: array{archivedAt: string, id: int}|null}
	 */
	public static function listArchivedIdsForUser(array $accessCodes, int $limit, ?array $afterCursor = null): array
	{
		$limit = max(1, min(200, $limit));

		$isAdmin = (bool)PortalAdmin::isCurrentUserAdmin();

		$codesPersonal = array_values(array_unique(array_filter(
			$accessCodes,
			static fn($code) => is_string($code) && $code !== '' && $code !== '*',
		)));

		$accessibleCollectionIds = [];
		if (!$isAdmin)
		{
			$collectionLevels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];
			foreach ($collectionLevels as $cid => $level)
			{
				if ((int)$level >= CollectionAccessService::LEVEL_VIEW)
				{
					$accessibleCollectionIds[] = (int)$cid;
				}
			}

			if (empty($codesPersonal) && empty($accessibleCollectionIds))
			{
				return ['ids' => [], 'nextCursor' => null];
			}
		}

		$query = DocumentTable::query()
			->setSelect(['ID', 'ARCHIVED_AT'])
			->where('IS_ARCHIVED', 'Y')
			->whereNotNull('ARCHIVED_AT')
			->whereNull('RECYCLE_BIN.ID')
		;

		if (!$isAdmin)
		{
			$accessFilter = Query::filter()->logic('or');
			if (!empty($accessibleCollectionIds))
			{
				$accessFilter->whereIn('COLLECTION_ID', $accessibleCollectionIds);
			}
			if (!empty($codesPersonal))
			{
				$documentGrantFilter = Query::filter()
					->whereIn(
						'ID',
						DocumentAccessTable::query()
							->setSelect(['DOCUMENT_ID'])
							->whereIn('SUBJECT_CODE', $codesPersonal)
							->where('LEVEL', '>=', self::LEVEL_VIEW),
					)
					->whereNotIn(
						'ID',
						DocumentAccessTable::query()
							->setSelect(['DOCUMENT_ID'])
							->whereIn('SUBJECT_CODE', $codesPersonal)
							->where('LEVEL', self::LEVEL_NONE),
					)
				;
				$accessFilter->where($documentGrantFilter);
			}
			$query->where($accessFilter);
		}

		$cursorId = isset($afterCursor['id']) ? (int)$afterCursor['id'] : 0;
		$cursorAtRaw = is_string($afterCursor['archivedAt'] ?? null) ? $afterCursor['archivedAt'] : '';
		if ($cursorId > 0 && $cursorAtRaw !== '')
		{
			$cursorAt = DateTime::createFromPhp(new \DateTime($cursorAtRaw));
			$query->where(Query::filter()->logic('or')
				->where('ARCHIVED_AT', '<', $cursorAt)
				->where(Query::filter()
					->where('ARCHIVED_AT', $cursorAt)
					->where('ID', '<', $cursorId)
				)
			);
		}

		$query
			->addOrder('ARCHIVED_AT', 'DESC')
			->addOrder('ID', 'DESC')
			->setLimit($limit + 1)
		;

		$rows = [];
		$result = $query->exec();
		while ($row = $result->fetch())
		{
			$archivedAt = $row['ARCHIVED_AT'];
			if ($archivedAt instanceof DateTime)
			{
				$archivedAtSql = $archivedAt->format('Y-m-d H:i:s');
			}
			elseif ($archivedAt !== null && $archivedAt !== '')
			{
				$archivedAtSql = (string)$archivedAt;
			}
			else
			{
				$archivedAtSql = '';
			}
			$rows[] = [
				'id' => (int)$row['ID'],
				'archivedAt' => $archivedAtSql,
			];
		}

		$nextCursor = null;
		if (count($rows) > $limit)
		{
			$rows = array_slice($rows, 0, $limit);
			$last = end($rows);
			$nextCursor = ['archivedAt' => $last['archivedAt'], 'id' => $last['id']];
		}

		$ids = array_map(static fn(array $row): int => $row['id'], $rows);

		return ['ids' => $ids, 'nextCursor' => $nextCursor];
	}

	/**
	 * Returns all archived document ids whose collection grants the user MANAGE-level.
	 * No pagination — used by RestoreAllArchivedDocumentsCommand only.
	 *
	 * @return int[]
	 */
	public static function listArchivedIdsForUserWithManageAccess(int $userId): array
	{
		if ($userId <= 0)
		{
			return [];
		}

		if (PortalAdmin::isAdmin($userId))
		{
			$rows = DocumentTable::query()
				->setSelect(['ID'])
				->where('IS_ARCHIVED', 'Y')
				->whereNull('RECYCLE_BIN.ID')
				->fetchAll()
			;

			return array_map(static fn(array $row): int => (int)$row['ID'], $rows);
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		$collectionLevels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];
		$manageCollectionIds = [];
		foreach ($collectionLevels as $cid => $level)
		{
			if ((int)$level >= CollectionAccessService::LEVEL_MANAGE)
			{
				$manageCollectionIds[] = (int)$cid;
			}
		}

		if (empty($manageCollectionIds))
		{
			return [];
		}

		$rows = DocumentTable::query()
			->setSelect(['ID'])
			->where('IS_ARCHIVED', 'Y')
			->whereIn('COLLECTION_ID', $manageCollectionIds)
			->whereNull('RECYCLE_BIN.ID')
			->fetchAll()
		;

		return array_map(static fn(array $row): int => (int)$row['ID'], $rows);
	}

	public static function isPortalAdmin(int $userId): bool
	{
		return PortalAdmin::isAdmin($userId);
	}

	/**
	 * Returns recycleBinIds visible to the user, paginated by composite cursor (TRASHED_AT DESC, ID DESC).
	 * A row is visible when the user is admin, or:
	 *   - DOCUMENT.COLLECTION_ID is in the user's accessible-collection list (VIEW+) on a live collection, OR
	 *   - the source collection no longer exists AND user is TRASHED_BY or DOCUMENT.CREATED_BY (orphan).
	 *
	 * @param array<int, string> $accessCodes
	 * @param array{trashedAt: string, recycleBinId: int}|null $afterCursor
	 * @return array{ids: int[], nextCursor: array{trashedAt: string, recycleBinId: int}|null}
	 */
	public static function listRecycleBinRecordsForUser(int $userId, array $accessCodes, int $limit, ?array $afterCursor = null): array
	{
		if ($userId <= 0)
		{
			return ['ids' => [], 'nextCursor' => null];
		}

		$limit = max(1, min(200, $limit));
		$fetchLimit = $limit + 1;

		$isAdmin = self::isPortalAdmin($userId);

		$accessibleCollectionIds = [];
		if (!$isAdmin)
		{
			$collectionLevels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];
			foreach ($collectionLevels as $cid => $level)
			{
				if ((int)$level >= CollectionAccessService::LEVEL_VIEW)
				{
					$accessibleCollectionIds[] = (int)$cid;
				}
			}
		}

		$rows = (new RecycleBinRepository())->listVisible(
			$isAdmin ? null : $userId,
			$accessibleCollectionIds,
			$afterCursor,
			$fetchLimit,
		);

		$nextCursor = null;
		if (count($rows) > $limit)
		{
			$rows = array_slice($rows, 0, $limit);
			$last = end($rows);
			$nextCursor = ['trashedAt' => $last['trashedAt'], 'recycleBinId' => $last['id']];
		}

		$ids = array_map(static fn(array $row): int => $row['id'], $rows);

		return ['ids' => $ids, 'nextCursor' => $nextCursor];
	}

	/**
	 * Visibility gate for trashed documents (controller getAction, mapping).
	 * Aligned with listVisible:
	 *   - admin → true
	 *   - source collection alive → user must have VIEW+ on it (authorship/trashedBy alone
	 *     is not enough; revoking VIEW must hide the trashed document)
	 *   - source collection gone (orphan) → trashedBy or document.createdBy may see it.
	 */
	public static function canViewInRecycleBin(int $userId, RecycleBinRecord $record): bool
	{
		if ($userId <= 0)
		{
			return false;
		}

		if (self::isPortalAdmin($userId))
		{
			return true;
		}

		$meta = self::resolveDocumentMeta($record->getDocumentId());
		if ($meta === null)
		{
			return false;
		}

		$collectionId = $meta['collectionId'];
		$collectionAlive = $collectionId > 0 && self::collectionExists($collectionId);

		if (!$collectionAlive)
		{
			return $record->getTrashedBy() === $userId || $meta['createdBy'] === $userId;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		$levels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];

		return ((int)($levels[$collectionId] ?? 0)) >= CollectionAccessService::LEVEL_VIEW;
	}

	public static function canRestoreFromRecycleBin(int $userId, RecycleBinRecord $record): bool
	{
		if ($userId <= 0)
		{
			return false;
		}

		if (self::isPortalAdmin($userId))
		{
			return true;
		}

		$meta = self::resolveDocumentMeta($record->getDocumentId());
		if ($meta === null)
		{
			return false;
		}

		$collectionId = $meta['collectionId'];
		if ($collectionId <= 0 || !self::collectionExists($collectionId))
		{
			// orphan: only the user who trashed it or the document author may restore
			// (target collection is picked separately and re-validated for MANAGE)
			return $record->getTrashedBy() === $userId || $meta['createdBy'] === $userId;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		$levels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];

		return ((int)($levels[$collectionId] ?? 0)) >= CollectionAccessService::LEVEL_MANAGE;
	}

	public static function canHardDeleteFromRecycleBin(int $userId, RecycleBinRecord $record): bool
	{
		if ($userId <= 0)
		{
			return false;
		}

		if (self::isPortalAdmin($userId))
		{
			return true;
		}

		$meta = self::resolveDocumentMeta($record->getDocumentId());
		if ($meta === null)
		{
			return false;
		}

		$collectionId = $meta['collectionId'];
		if ($collectionId <= 0 || !self::collectionExists($collectionId))
		{
			return $record->getTrashedBy() === $userId;
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		$levels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];

		return ((int)($levels[$collectionId] ?? 0)) >= CollectionAccessService::LEVEL_MANAGE;
	}

	/**
	 * Batch ACL computation for recycle-bin listings — replaces N×(canView/canRestore/canHardDelete)
	 * point queries with: 1 SELECT documents + 1 SELECT collections + 1 user-levels rebuild.
	 *
	 * @param RecycleBinRecord[] $records
	 * @return array<int, array{canView: bool, canRestore: bool, canHardDelete: bool}>
	 *         keyed by recycle-bin record ID. Missing keys mean no access.
	 */
	public static function bulkComputeRecycleBinAcl(int $userId, array $records): array
	{
		if ($userId <= 0 || empty($records))
		{
			return [];
		}

		if (self::isPortalAdmin($userId))
		{
			$out = [];
			foreach ($records as $record)
			{
				$out[(int)$record->getId()] = ['canView' => true, 'canRestore' => true, 'canHardDelete' => true];
			}

			return $out;
		}

		$documentIds = [];
		foreach ($records as $record)
		{
			$documentIds[(int)$record->getDocumentId()] = true;
		}

		$metaById = [];
		if (!empty($documentIds))
		{
			$rows = DocumentTable::query()
				->setSelect(['ID', 'COLLECTION_ID', 'CREATED_BY'])
				->whereIn('ID', array_keys($documentIds))
				->exec();
			while ($row = $rows->fetch())
			{
				$metaById[(int)$row['ID']] = [
					'collectionId' => (int)($row['COLLECTION_ID'] ?? 0),
					'createdBy' => (int)($row['CREATED_BY'] ?? 0),
				];
			}
		}

		$collectionIds = [];
		foreach ($metaById as $meta)
		{
			if ($meta['collectionId'] > 0)
			{
				$collectionIds[$meta['collectionId']] = true;
			}
		}

		$aliveCollections = [];
		if (!empty($collectionIds))
		{
			$rows = CollectionTable::query()
				->setSelect(['ID'])
				->whereIn('ID', array_keys($collectionIds))
				->exec();
			while ($row = $rows->fetch())
			{
				$aliveCollections[(int)$row['ID']] = true;
			}
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		$levels = CollectionAccessService::getAllUserLevels($accessCodes)['effective'] ?? [];

		$out = [];
		foreach ($records as $record)
		{
			$recordId = (int)$record->getId();
			$documentId = (int)$record->getDocumentId();
			$trashedBy = (int)$record->getTrashedBy();
			$meta = $metaById[$documentId] ?? null;

			if ($meta === null)
			{
				$out[$recordId] = ['canView' => false, 'canRestore' => false, 'canHardDelete' => false];

				continue;
			}

			$collectionId = $meta['collectionId'];
			$createdBy = $meta['createdBy'];
			$alive = $collectionId > 0 && isset($aliveCollections[$collectionId]);
			$level = $alive ? (int)($levels[$collectionId] ?? 0) : 0;

			$canView = $alive
				? $level >= CollectionAccessService::LEVEL_VIEW
				: ($trashedBy === $userId || $createdBy === $userId);

			$canRestore = $alive
				? $level >= CollectionAccessService::LEVEL_MANAGE
				: ($trashedBy === $userId || $createdBy === $userId);

			$canHardDelete = $alive
				? $level >= CollectionAccessService::LEVEL_MANAGE
				: $trashedBy === $userId;

			$out[$recordId] = [
				'canView' => $canView,
				'canRestore' => $canRestore,
				'canHardDelete' => $canHardDelete,
			];
		}

		return $out;
	}

	private static function resolveDocumentCollectionId(int $documentId): ?int
	{
		$meta = self::resolveDocumentMeta($documentId);

		return $meta === null ? null : $meta['collectionId'];
	}

	/**
	 * @return array{collectionId: int, createdBy: int}|null
	 */
	private static function resolveDocumentMeta(int $documentId): ?array
	{
		if ($documentId <= 0)
		{
			return null;
		}

		$row = DocumentTable::query()
			->setSelect(['COLLECTION_ID', 'CREATED_BY'])
			->where('ID', $documentId)
			->setLimit(1)
			->fetch();

		if ($row === false)
		{
			return null;
		}

		return [
			'collectionId' => (int)($row['COLLECTION_ID'] ?? 0),
			'createdBy' => (int)($row['CREATED_BY'] ?? 0),
		];
	}

	private static function collectionExists(int $collectionId): bool
	{
		if ($collectionId <= 0)
		{
			return false;
		}

		$row = \Bitrix\Note\Internal\Model\CollectionTable::query()
			->setSelect(['ID'])
			->where('ID', $collectionId)
			->setLimit(1)
			->fetch();

		return $row !== false;
	}

	private static function getCurrentUserAccessCodes(int $userId): array
	{
		if ($userId <= 0 || !class_exists('\CAccess'))
		{
			return [];
		}

		$codes = \CAccess::getUserCodesArray($userId);

		return is_array($codes) ? $codes : [];
	}
}

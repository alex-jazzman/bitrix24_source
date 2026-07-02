<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Repository;

use Bitrix\Main\Application;
use Bitrix\Main\ORM\Data\Result as OrmResult;
use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class DocumentRepository
{
	private const ORM_CACHE_TTL = 15;

	private ?RecycleBinFilter $recycleBinFilter = null;

	private function recycleBinFilter(): RecycleBinFilter
	{
		return $this->recycleBinFilter ??= new RecycleBinFilter();
	}

	private const LIST_SELECT = [
		'ID', 'COLLECTION_ID', 'PARENT_ID', 'TITLE',
		'POSITION', 'IS_ARCHIVED', 'CREATED_BY', 'UPDATED_BY',
		'CREATED_AT', 'UPDATED_AT',
	];

	private const TREE_SELECT = [
		'ID', 'COLLECTION_ID', 'PARENT_ID', 'TITLE', 'POSITION', 'IS_ARCHIVED',
	];

	public function save(Document $document): Result
	{
		$now = new DateTime();
		$document->setUpdatedAt($now);
		if ($document->getId() === null)
		{
			$document->setCreatedAt($now);
		}

		$saveResult = $document->save();

		if (!$saveResult->isSuccess())
		{
			return $this->buildFailedSaveResult($saveResult);
		}

		$result = new Result();
		$result->setData(['document' => $document]);

		return $result;
	}

	public function getById(int $id): ?Document
	{
		return DocumentTable::getByPrimary($id, ['cache' => ['ttl' => self::ORM_CACHE_TTL]])->fetchObject();
	}

	public function getYjsState(int $id): ?string
	{
		$row = DocumentTable::query()
			->setSelect(['YJS_STATE'])
			->where('ID', $id)
			->fetch()
		;

		if ($row && $row['YJS_STATE'] !== null && $row['YJS_STATE'] !== '')
		{
			return (string)$row['YJS_STATE'];
		}

		return null;
	}

	public function getRawMarkdown(int $id): ?string
	{
		$row = DocumentTable::query()
			->setSelect(['MARKDOWN'])
			->where('ID', $id)
			->fetch()
		;

		if ($row === false)
		{
			return null;
		}

		$value = $row['MARKDOWN'] ?? null;

		return $value === null ? '' : (string)$value;
	}

	public function getMetaById(int $id, array $select = self::LIST_SELECT): ?Document
	{
		return DocumentTable::query()
			->setSelect($select)
			->where('ID', $id)
			->setCacheTtl(self::ORM_CACHE_TTL)
			->fetchObject()
		;
	}

	/**
	 * @param int[] $ids
	 * @return Document[] preserving the order of $ids
	 */
	public function getMetaByIds(array $ids, array $select = self::LIST_SELECT): array
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));

		if (empty($normalizedIds))
		{
			return [];
		}

		$documents = DocumentTable::query()
			->setSelect($select)
			->whereIn('ID', $normalizedIds)
			->fetchCollection()
			->getAll()
		;

		$byId = [];
		foreach ($documents as $document)
		{
			$byId[(int)$document->getId()] = $document;
		}

		$ordered = [];
		foreach ($normalizedIds as $id)
		{
			if (isset($byId[$id]))
			{
				$ordered[] = $byId[$id];
			}
		}

		return $ordered;
	}

	/**
	 * Batch SELECT by primary key. Returns map [id => row].
	 *
	 * @param int[] $ids
	 * @param string[] $select
	 * @return array<int, array<string, mixed>>
	 */
	public function getByIds(array $ids, array $select = self::LIST_SELECT): array
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalizedIds))
		{
			return [];
		}

		$rows = DocumentTable::getList([
			'select' => $select,
			'filter' => ['=ID' => $normalizedIds],
		])->fetchAll();

		$map = [];
		foreach ($rows as $row)
		{
			$map[(int)$row['ID']] = $row;
		}

		return $map;
	}

	public function updatePartial(int $id, array $fields): void
	{
		if (empty($fields))
		{
			return;
		}

		DocumentTable::update($id, $fields);
	}

	public function getMaxPosition(int $collectionId, ?int $parentId): int
	{
		$query = DocumentTable::query()
			->setSelect(['MAX_POSITION'])
			->registerRuntimeField(
				new \Bitrix\Main\ORM\Fields\ExpressionField('MAX_POSITION', 'MAX(%s)', 'POSITION'),
			)
			->where('COLLECTION_ID', $collectionId)
		;
		if ($parentId === null)
		{
			$query->whereNull('PARENT_ID');
		}
		else
		{
			$query->where('PARENT_ID', $parentId);
		}
		$this->recycleBinFilter()->applyExclusion($query);

		$row = $query->fetch();

		return (int)($row['MAX_POSITION'] ?? 0);
	}

	/**
	 * @return Document[]
	 */

	public function getCollectionDocuments(int $collectionId): array
	{
		$query = DocumentTable::query()
			->setSelect(self::TREE_SELECT)
			->where('COLLECTION_ID', $collectionId)
			->where('IS_ARCHIVED', 'N')
			->addOrder('PARENT_ID', 'ASC')
			->addOrder('POSITION', 'DESC')
			->addOrder('ID', 'DESC')
		;
		$this->recycleBinFilter()->applyExclusion($query);

		return $query->fetchCollection()->getAll();
	}

	/**
	 * @return Document[]
	 */
	public function getDocumentsByParent(
		int $collectionId,
		?int $parentId,
		?int $limit = null,
		int $offset = 0,
	): array
	{
		$query = $this->buildParentQuery($collectionId, $parentId, true)
			->setSelect(self::TREE_SELECT)
		;
		if ($limit !== null && $limit > 0)
		{
			$query->setLimit($limit);
			$query->setOffset(max(0, $offset));
		}
		$query->setCacheTtl(self::ORM_CACHE_TTL);

		return $query->fetchCollection()->getAll();
	}

	public function listByCollectionFlat(
		int $collectionId,
		?int $createdByUserId,
		int $limit,
		?int $afterPosition = null,
		?int $afterId = null,
		bool $rootsOnly = false,
	): array
	{
		// ORDER BY (POSITION DESC, ID DESC) matches user-controlled drag-n-drop order in the desktop tree
		// and uses IX_NOTE_DOC_BRANCH as a backward index scan without filesort.
		$query = DocumentTable::query()
			->setSelect(self::LIST_SELECT)
			->where('COLLECTION_ID', $collectionId)
			->where('IS_ARCHIVED', 'N')
			->addOrder('POSITION', 'DESC')
			->addOrder('ID', 'DESC')
		;

		if ($rootsOnly)
		{
			$query->whereNull('PARENT_ID');
		}

		if ($createdByUserId !== null && $createdByUserId > 0)
		{
			$query->where('CREATED_BY', $createdByUserId);
		}

		if ($afterPosition !== null && $afterId !== null)
		{
			$query->where(
				Query::filter()->logic('or')
					->where('POSITION', '<', $afterPosition)
					->where(
						Query::filter()
							->where('POSITION', $afterPosition)
							->where('ID', '<', $afterId)
					)
			);
		}

		if ($limit > 0)
		{
			$query->setLimit($limit);
		}

		$this->recycleBinFilter()->applyExclusion($query);

		return $query->fetchCollection()->getAll();
	}

	public function getDocumentMetaByParent(
		int $collectionId,
		?int $parentId,
		?int $limit = null,
		?int $afterPosition = null,
		?int $afterId = null,
	): array
	{
		$query = $this->buildParentQuery($collectionId, $parentId, true)
			->setSelect(self::LIST_SELECT)
		;
		if ($afterPosition !== null && $afterId !== null)
		{
			$query->where(
				Query::filter()->logic('or')
					->where('POSITION', '<', $afterPosition)
					->where(
						Query::filter()
							->where('POSITION', $afterPosition)
							->where('ID', '<', $afterId)
					)
			);
		}
		if ($limit !== null && $limit > 0)
		{
			$query->setLimit($limit);
		}
		$query->setCacheTtl(self::ORM_CACHE_TTL);

		return $query->fetchCollection()->getAll();
	}

	public function getBranchDocuments(int $collectionId, ?int $parentId): array
	{
		return $this->buildParentQuery($collectionId, $parentId, false)
			->setSelect(self::TREE_SELECT)
			->fetchCollection()
			->getAll()
		;
	}

	public function getBranchDocumentsMeta(int $collectionId, ?int $parentId): array
	{
		return $this->buildParentQuery($collectionId, $parentId, false)
			->setSelect(self::LIST_SELECT)
			->fetchCollection()
			->getAll()
		;
	}

	public function getDocumentPathToRoot(int $documentId, int $maxDepth = 200): array
	{
		$path = [];
		$visited = [];
		$current = $this->getMetaById($documentId, self::TREE_SELECT);
		if ($current === null)
		{
			return [];
		}

		$targetCollectionId = $current->getCollectionId();
		$depth = 0;

		while ($current !== null && $depth < $maxDepth)
		{
			$parentId = $current->getParentId();
			if ($parentId === null || $parentId <= 0)
			{
				break;
			}

			if (isset($visited[$parentId]))
			{
				break;
			}

			$visited[$parentId] = true;
			$parent = $this->getMetaById($parentId, self::TREE_SELECT);
			if ($parent === null)
			{
				break;
			}

			if ($parent->getIsArchived() || $parent->getCollectionId() !== $targetCollectionId)
			{
				break;
			}

			$path[] = $parent;
			$current = $parent;
			$depth++;
		}

		return array_reverse($path);
	}

	public function getHasChildrenMap(int $collectionId, array $documentIds): array
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));

		if (empty($normalizedIds))
		{
			return [];
		}

		$childrenCountMap = $this->getChildrenCountMapByParentIds($collectionId, $normalizedIds);
		$result = [];
		foreach ($normalizedIds as $id)
		{
			$result[$id] = (int)($childrenCountMap[$id] ?? 0) > 0;
		}

		return $result;
	}

	public function getChildrenCountMapByParentIds(int $collectionId, array $parentIds): array
	{
		$normalizedParentIds = array_values(array_unique(array_map(
			static fn($id): int => (int)$id,
			$parentIds
		)));

		if (empty($normalizedParentIds))
		{
			return [];
		}

		$query = DocumentTable::query()
			->setSelect(['PARENT_ID'])
			->where('COLLECTION_ID', $collectionId)
			->where('IS_ARCHIVED', 'N')
			->whereIn('PARENT_ID', $normalizedParentIds)
			->setDistinct()
			->setCacheTtl(self::ORM_CACHE_TTL)
		;
		$this->recycleBinFilter()->applyExclusion($query);
		$query = $query->exec();

		$result = [];
		while ($row = $query->fetch())
		{
			$parentId = (int)($row['PARENT_ID'] ?? 0);
			if ($parentId > 0)
			{
				$result[$parentId] = 1;
			}
		}

		return $result;
	}

	public function getChildrenCountMap(int $collectionId): array
	{
		$query = DocumentTable::query()
			->setSelect(['PARENT_ID'])
			->where('COLLECTION_ID', $collectionId)
			->where('IS_ARCHIVED', 'N')
			->whereNotNull('PARENT_ID')
			->setDistinct()
		;
		$this->recycleBinFilter()->applyExclusion($query);
		$query = $query->exec();

		$result = [];
		while ($row = $query->fetch())
		{
			$parentId = (int)($row['PARENT_ID'] ?? 0);
			if ($parentId > 0)
			{
				$result[$parentId] = 1;
			}
		}

		return $result;
	}

	public function getSubtreeIds(int $rootId, int $collectionId, bool $includeRecycleBin = false): array
	{
		if ($rootId <= 0 || $collectionId <= 0)
		{
			return [];
		}

		$idsMap = [$rootId => true];
		$parentIds = [$rootId];
		while (!empty($parentIds))
		{
			$query = DocumentTable::query()
				->setSelect(['ID'])
				->where('COLLECTION_ID', $collectionId)
				->whereIn('PARENT_ID', $parentIds)
			;
			if (!$includeRecycleBin)
			{
				$this->recycleBinFilter()->applyExclusion($query);
			}
			$documents = $query->fetchCollection();

			$nextParentIds = [];
			foreach ($documents as $doc)
			{
				$childId = (int)$doc->getId();
				if ($childId <= 0 || isset($idsMap[$childId]))
				{
					continue;
				}

				$idsMap[$childId] = true;
				$nextParentIds[] = $childId;
			}

			$parentIds = $nextParentIds;
		}

		return array_map('intval', array_keys($idsMap));
	}

	/**
	 * Legacy: используется DeleteDocumentCommand (soft-delete без метаданных архивации).
	 * Когда появится корзина — Delete*Command переедет в свою таблицу, и метод будет удалён.
	 */
	public function archiveByIdsLegacy(array $ids): void
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalizedIds))
		{
			return;
		}

		DocumentTable::updateMulti($normalizedIds, ['IS_ARCHIVED' => 'Y'], true);
	}

	public function archiveByIds(array $ids, int $userId): void
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalizedIds))
		{
			return;
		}

		$connection = Application::getConnection();
		$placeholders = implode(',', $normalizedIds);
		$userIdSafe = (int)$userId;
		$connection->queryExecute(
			"UPDATE b_note_document"
			. " SET IS_ARCHIVED = 'Y',"
			. " ARCHIVED_AT = NOW(),"
			. " ARCHIVED_BY = {$userIdSafe},"
			. " UPDATED_AT = NOW(),"
			. " UPDATED_BY = {$userIdSafe}"
			. " WHERE ID IN ({$placeholders})"
			. " AND IS_ARCHIVED = 'N'"
		);
		DocumentTable::cleanCache();
	}

	public function restoreByIds(array $ids, int $userId): void
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalizedIds))
		{
			return;
		}

		$connection = Application::getConnection();
		$placeholders = implode(',', $normalizedIds);
		$userIdSafe = (int)$userId;
		$connection->queryExecute(
			"UPDATE b_note_document"
			. " SET IS_ARCHIVED = 'N',"
			. " ARCHIVED_AT = NULL,"
			. " ARCHIVED_BY = NULL,"
			. " UPDATED_AT = NOW(),"
			. " UPDATED_BY = {$userIdSafe}"
			. " WHERE ID IN ({$placeholders})"
			. " AND IS_ARCHIVED = 'Y'"
		);
		DocumentTable::cleanCache();
	}

	public function liftArchivedOrphansToRoot(array $ids): void
	{
		$normalizedIds = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $ids),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalizedIds))
		{
			return;
		}

		$rows = DocumentTable::query()
			->setSelect(['ID'])
			->whereIn('ID', $normalizedIds)
			->whereNotNull('PARENT_ID')
			->where(Query::filter()->logic('or')
				->whereNull('PARENT.ID')
				->where('PARENT.IS_ARCHIVED', 'Y')
			)
			->fetchAll()
		;

		$idsToLift = array_map(static fn(array $row): int => (int)$row['ID'], $rows);
		if (empty($idsToLift))
		{
			return;
		}

		DocumentTable::updateMulti($idsToLift, ['PARENT_ID' => null], true);
	}

	public function getLiveCollectionDocumentIds(int $collectionId): array
	{
		if ($collectionId <= 0)
		{
			return [];
		}

		$query = DocumentTable::query()
			->setSelect(['ID'])
			->where('COLLECTION_ID', $collectionId)
			->where('IS_ARCHIVED', 'N')
		;
		$this->recycleBinFilter()->applyExclusion($query);
		$rows = $query->fetchAll();

		return array_map(static fn(array $row): int => (int)$row['ID'], $rows);
	}

	public function archiveByCollectionId(int $collectionId, int $userId = 0): void
	{
		$this->archiveByIds($this->getLiveCollectionDocumentIds($collectionId), max(0, $userId));
	}

	/**
	 * Keyset chunk iterator for cascade-delete in DeleteCollectionCommand.
	 * Selects only fields needed to enumerate descendants for the recycle-bin cascade.
	 *
	 * @return array<int, array{ID: int, IS_ARCHIVED: bool, PARENT_ID: ?int, POSITION: int, TITLE: string}>
	 */
	public function listByCollectionForCascadeDelete(int $collectionId, int $afterId, int $limit): array
	{
		if ($collectionId <= 0 || $limit <= 0)
		{
			return [];
		}

		$rows = DocumentTable::query()
			->setSelect(['ID', 'IS_ARCHIVED', 'PARENT_ID', 'POSITION', 'TITLE'])
			->where('COLLECTION_ID', $collectionId)
			->where('ID', '>', max(0, $afterId))
			->addOrder('ID', 'ASC')
			->setLimit($limit)
			->fetchAll()
		;

		return array_map(
			static fn(array $row): array => [
				'ID' => (int)$row['ID'],
				'IS_ARCHIVED' => ($row['IS_ARCHIVED'] ?? 'N') === 'Y',
				'PARENT_ID' => isset($row['PARENT_ID']) ? (int)$row['PARENT_ID'] : null,
				'POSITION' => (int)($row['POSITION'] ?? 0),
				'TITLE' => (string)($row['TITLE'] ?? ''),
			],
			$rows,
		);
	}

	public function deleteById(int $id): void
	{
		if ($id > 0)
		{
			DocumentTable::delete($id);
		}
	}

	/**
	 * @param int[] $documentIds
	 */
	public function deleteByIds(array $documentIds): void
	{
		$normalized = array_values(array_unique(array_filter(
			array_map(static fn($id): int => (int)$id, $documentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if (empty($normalized))
		{
			return;
		}

		$connection = Application::getConnection();
		$placeholders = implode(',', $normalized);
		$connection->queryExecute("DELETE FROM b_note_document WHERE ID IN ({$placeholders})");
	}

	private function buildFailedSaveResult(OrmResult $ormResult): Result
	{
		$result = new Result();
		foreach ($ormResult->getErrors() as $error)
		{
			$result->addError($error);
		}

		return $result;
	}

	private function buildParentQuery(int $collectionId, ?int $parentId, bool $activeOnly): Query
	{
		$query = DocumentTable::query()
			->where('COLLECTION_ID', $collectionId)
			->addOrder('POSITION', 'DESC')
			->addOrder('ID', 'DESC')
		;

		if ($activeOnly)
		{
			$query->where('IS_ARCHIVED', 'N');
		}

		if ($parentId === null)
		{
			$query->whereNull('PARENT_ID');
		}
		else
		{
			$query->where('PARENT_ID', $parentId);
		}

		$this->recycleBinFilter()->applyExclusion($query);

		return $query;
	}

}

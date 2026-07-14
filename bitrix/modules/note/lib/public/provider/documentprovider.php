<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Provider;

use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Access\PortalAdmin;
use Bitrix\Note\Internal\Exceptions\AccessDeniedException;
use Bitrix\Note\Internal\Exceptions\CollectionNotFoundException;
use Bitrix\Note\Internal\Exceptions\DocumentNotFoundException;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Document\DocumentCardMetaResolver;
use Bitrix\Note\Internal\Service\User\SystemUser;
use Bitrix\Note\Public\Provider\Dto\DocumentReadDto;

final class DocumentProvider
{
	public function __construct(
		private readonly DocumentRepository $documentRepository = new DocumentRepository(),
		private readonly DocumentCardMetaResolver $cardMetaResolver = new DocumentCardMetaResolver(),
		private readonly CollectionRepository $collectionRepository = new CollectionRepository(),
	) {}

	public function getById(int $id): ?Document
	{
		return $this->documentRepository->getById($id);
	}

	public function getMetaById(int $id): ?Document
	{
		return $this->documentRepository->getMetaById($id);
	}

	/**
	 * Returns only the ownership fields (id, collectionId) needed by callers that
	 * just want to resolve the collection for an access check. Keeps the SELECT
	 * narrow and hides repository column details from callers.
	 *
	 * @return array{id: int, collectionId: int}|null
	 */
	public function getOwnershipInfo(int $id): ?array
	{
		$document = $this->documentRepository->getMetaById($id, ['ID', 'COLLECTION_ID']);
		if ($document === null)
		{
			return null;
		}

		return [
			'id' => (int)$document->getId(),
			'collectionId' => (int)$document->getCollectionId(),
		];
	}

	public function getForRead(int $id): DocumentReadDto
	{
		// Meta only: markdown is fetched below via getRawMarkdown, so the heavy MARKDOWN/YJS_STATE blobs are skipped here.
		$document = $this->documentRepository->getMetaById($id);
		if ($document === null || $document->getIsArchived())
		{
			throw new DocumentNotFoundException();
		}

		$documentId = (int)$document->getId();
		$collectionId = (int)$document->getCollectionId();
		$snapshot = DocumentAccessService::getCurrentUserSnapshot($documentId, $collectionId);
		if (!$snapshot['canView'])
		{
			throw new DocumentNotFoundException();
		}

		$markdown = $this->documentRepository->getRawMarkdown($id) ?? '';

		return new DocumentReadDto(
			id: $documentId,
			collectionId: $snapshot['sharedAccess'] ? null : $collectionId,
			parentId: $document->getParentId() !== null ? (int)$document->getParentId() : null,
			title: (string)$document->getTitle(),
			markdown: $markdown,
			position: (int)$document->getPosition(),
			createdBy: (int)$document->getCreatedBy(),
			updatedBy: (int)$document->getUpdatedBy(),
			// REST-only read path: datetime is returned in UTC (ISO 8601 with Z).
			createdAt: gmdate('Y-m-d\TH:i:s\Z', $document->getCreatedAt()->getTimestamp()),
			updatedAt: gmdate('Y-m-d\TH:i:s\Z', $document->getUpdatedAt()->getTimestamp()),
		);
	}

	/**
	 * Returns documents accessible only via document-level grants (no collection VIEW).
	 * Payload omits any collection-level fields to enforce privacy.
	 *
	 * @param array<int, string> $accessCodes
	 * @param array{id: int}|null $afterCursor
	 * @return array{documents: array<int, array{id: int, parentId: ?int, title: string, position: int, updatedAt: string, hasChildren: bool}>, nextCursor: ?array{id: int}}
	 */
	public function getSharedWithMe(array $accessCodes, int $limit, ?array $afterCursor = null): array
	{
		$page = DocumentAccessService::listSharedWithMeIds($accessCodes, $limit, $afterCursor);
		if (empty($page['ids']))
		{
			return ['documents' => [], 'nextCursor' => $page['nextCursor']];
		}

		$documents = $this->documentRepository->getMetaByIds($page['ids']);

		$authorIdByDocumentId = [];
		foreach ($documents as $document)
		{
			$authorIdByDocumentId[(int)$document->getId()] = (int)$document->getCreatedBy();
		}
		$cardMeta = $this->cardMetaResolver->resolve($authorIdByDocumentId);

		$payload = [];
		foreach ($documents as $document)
		{
			$id = (int)$document->getId();
			$meta = $cardMeta[$id] ?? ['excerpt' => '', 'author' => null];
			$payload[] = [
				'id' => $id,
				'parentId' => $document->getParentId() !== null ? (int)$document->getParentId() : null,
				'title' => (string)$document->getTitle(),
				'position' => (int)$document->getPosition(),
				'updatedAt' => $document->getUpdatedAt()->format('c'),
				'hasChildren' => false,
				'excerpt' => $meta['excerpt'],
				'author' => $meta['author'],
			];
		}

		return ['documents' => $payload, 'nextCursor' => $page['nextCursor']];
	}

	/**
	 * Returns active documents of a collection as a flat list, ordered by (POSITION DESC, ID DESC) —
	 * the same order users see in the desktop tree. The keyset cursor pair lets MySQL stay on the
	 * IX_NOTE_DOC_BRANCH backward index scan without filesort.
	 * Optionally filtered by creator (for the "created by me" tab on the workspace page).
	 * When $rootsOnly is true, only top-level documents (PARENT_ID IS NULL) are returned;
	 * used by the mobile flat-list view to hide nested documents.
	 *
	 * @param array{position: int, id: int}|null $afterCursor
	 * @return array{
	 *   items: array<int, array{
	 *     id: int,
	 *     parentId: ?int,
	 *     title: string,
	 *     position: int,
	 *     updatedAt: string,
	 *     excerpt: string,
	 *     author: ?array{id: int, name: string}
	 *   }>,
	 *   nextCursor: ?array{position: int, id: int}
	 * }
	 */
	public function getListByCollection(
		int $collectionId,
		bool $ownedByMe,
		int $userId,
		int $limit,
		?array $afterCursor = null,
		bool $rootsOnly = false,
	): array
	{
		$collection = $this->collectionRepository->getById($collectionId);
		if ($collection === null || $collection->getIsArchived())
		{
			throw new CollectionNotFoundException();
		}

		$accessSnapshot = CollectionAccessService::getCurrentUserAccessSnapshot($collectionId);
		if ($accessSnapshot['effective'] < CollectionAccessService::LEVEL_VIEW)
		{
			throw new AccessDeniedException();
		}

		$afterPosition = null;
		$afterId = null;
		if (
			is_array($afterCursor)
			&& isset($afterCursor['position'], $afterCursor['id'])
			&& (int)$afterCursor['id'] > 0
		)
		{
			$afterPosition = (int)$afterCursor['position'];
			$afterId = (int)$afterCursor['id'];
		}

		$createdBy = ($ownedByMe && $userId > 0) ? $userId : null;
		$rawDocuments = $this->documentRepository->listByCollectionFlat(
			$collectionId,
			$createdBy,
			$limit + 1,
			$afterPosition,
			$afterId,
			$rootsOnly,
		);

		$hasNextPage = count($rawDocuments) > $limit;
		$documents = $hasNextPage
			? array_slice($rawDocuments, 0, $limit)
			: $rawDocuments
		;

		$authorIdByDocumentId = [];
		foreach ($documents as $document)
		{
			$authorIdByDocumentId[(int)$document->getId()] = (int)$document->getCreatedBy();
		}
		$cardMeta = $this->cardMetaResolver->resolve($authorIdByDocumentId);

		$items = [];
		$lastPosition = null;
		$lastId = null;
		foreach ($documents as $document)
		{
			$id = (int)$document->getId();
			$position = (int)$document->getPosition();
			$lastPosition = $position;
			$lastId = $id;

			$meta = $cardMeta[$id] ?? ['excerpt' => '', 'author' => null];
			$items[] = [
				'id' => $id,
				'parentId' => $document->getParentId() !== null ? (int)$document->getParentId() : null,
				'title' => (string)$document->getTitle(),
				'position' => $position,
				'updatedAt' => $document->getUpdatedAt()->format('c'),
				'excerpt' => $meta['excerpt'],
				'author' => $meta['author'],
			];
		}

		$collectionMeta = null;
		if ($afterCursor === null)
		{
			$collectionMeta = (new CollectionProvider())->mapCollectionWithLevels(
				$collection,
				$accessSnapshot['effective'],
				$accessSnapshot['policy'],
			);
		}

		return [
			'items' => $items,
			'nextCursor' => ($hasNextPage && $lastId !== null)
				? ['position' => $lastPosition, 'id' => $lastId]
				: null,
			'collection' => $collectionMeta,
		];
	}

	/**
	 * Returns archived documents accessible to the user, with composite cursor pagination.
	 *
	 * Privacy: documents visible only via document-grant (no collection-VIEW) hide collectionId
	 * and collectionTitle, mirroring the /shared/ contract.
	 *
	 * Invariant: $accessCodes and $userId belong to the same (current) user. Both the archive
	 * listing (via DocumentAccessService::listArchivedIdsForUser using $accessCodes) and the
	 * canRestore flag (via PortalAdmin::isAdmin($userId)) rely on this invariant; calling with
	 * a $userId of a different user is not supported.
	 *
	 * @param array<int, string> $accessCodes
	 * @param array{archivedAt: string, id: int}|null $afterCursor
	 * @return array{
	 *   items: array<int, array{
	 *     id: int,
	 *     parentId: ?int,
	 *     title: string,
	 *     collectionId: ?int,
	 *     collectionTitle: string,
	 *     archivedAt: ?string,
	 *     archivedBy: ?array{id: int, name: string, isSystem?: true},
	 *     canRestore: bool
	 *   }>,
	 *   nextCursor: ?array{archivedAt: string, id: int}
	 * }
	 */
	public function getArchivedForUser(array $accessCodes, int $userId, int $limit, ?array $afterCursor = null): array
	{
		$page = DocumentAccessService::listArchivedIdsForUser($accessCodes, $limit, $afterCursor);
		if (empty($page['ids']))
		{
			return ['items' => [], 'nextCursor' => $page['nextCursor']];
		}

		$documents = $this->documentRepository->getMetaByIds(
			$page['ids'],
			['ID', 'COLLECTION_ID', 'PARENT_ID', 'TITLE', 'POSITION', 'IS_ARCHIVED',
				'ARCHIVED_AT', 'ARCHIVED_BY', 'CREATED_BY', 'UPDATED_BY', 'CREATED_AT', 'UPDATED_AT'],
		);

		$collectionIds = [];
		$archivedByIds = [];
		foreach ($documents as $document)
		{
			$cid = (int)$document->getCollectionId();
			if ($cid > 0)
			{
				$collectionIds[$cid] = true;
			}
			$by = $document->getArchivedBy();
			if ($by !== null)
			{
				$archivedByIds[(int)$by] = true;
			}
		}

		$collectionTitles = $this->resolveCollectionTitles(array_keys($collectionIds));
		$userNames = $this->resolveUserNames(array_keys($archivedByIds));

		$authorIdByDocumentId = [];
		foreach ($documents as $document)
		{
			$authorIdByDocumentId[(int)$document->getId()] = (int)$document->getCreatedBy();
		}
		$cardMeta = $this->cardMetaResolver->resolve($authorIdByDocumentId);

		$isAdmin = PortalAdmin::isAdmin($userId);

		$collectionLevels = !empty($collectionIds)
			? CollectionAccessService::batchGetUserLevels(
				array_keys($collectionIds),
				array_values(array_unique([...$accessCodes, '*'])),
			)
			: [];

		$items = [];
		foreach ($documents as $document)
		{
			$id = (int)$document->getId();
			$cid = (int)$document->getCollectionId();
			$archivedAt = $document->getArchivedAt();
			$archivedBy = $document->getArchivedBy() !== null ? (int)$document->getArchivedBy() : null;
			$canRestore = $isAdmin
				|| (
					$userId > 0
					&& ($collectionLevels[$cid] ?? CollectionAccessService::LEVEL_NONE) >= CollectionAccessService::LEVEL_MANAGE
				);

			$meta = $cardMeta[$id] ?? ['excerpt' => '', 'author' => null];
			$collectionLevel = $collectionLevels[$cid] ?? CollectionAccessService::LEVEL_NONE;
			$sharedAccess = $collectionLevel < CollectionAccessService::LEVEL_VIEW;
			$isCollectionArchived = !empty($collectionTitles[$cid]['isArchived']);
			$hideCollection = $sharedAccess || $isCollectionArchived;
			$items[] = [
				'id' => $id,
				'parentId' => $document->getParentId() !== null ? (int)$document->getParentId() : null,
				'title' => (string)$document->getTitle(),
				'collectionId' => $hideCollection ? null : $cid,
				'collectionTitle' => $hideCollection ? '' : ($collectionTitles[$cid]['name'] ?? ''),
				'archivedAt' => $archivedAt !== null ? $archivedAt->format('c') : null,
				'archivedBy' => $archivedBy !== null
					? ($userNames[$archivedBy] ?? ['id' => $archivedBy, 'name' => 'User #' . $archivedBy])
					: null,
				'canRestore' => $canRestore,
				'excerpt' => $meta['excerpt'],
				'author' => $meta['author'],
			];
		}

		return ['items' => $items, 'nextCursor' => $page['nextCursor']];
	}

	/**
	 * @return int[]
	 */
	public function listArchivedIdsForUserWithManageAccess(int $userId): array
	{
		return DocumentAccessService::listArchivedIdsForUserWithManageAccess($userId);
	}

	/**
	 * @param int[] $ids
	 * @return array<int, array{name: string, isArchived: bool}>
	 */
	private function resolveCollectionTitles(array $ids): array
	{
		if (empty($ids))
		{
			return [];
		}

		$rows = \Bitrix\Note\Internal\Model\CollectionTable::query()
			->setSelect(['ID', 'NAME', 'IS_ARCHIVED'])
			->whereIn('ID', $ids)
			->setCacheTtl(60)
			->exec();

		$out = [];
		while ($row = $rows->fetch())
		{
			$out[(int)$row['ID']] = [
				'name' => (string)($row['NAME'] ?? ''),
				'isArchived' => ($row['IS_ARCHIVED'] ?? 'N') === 'Y',
			];
		}

		return $out;
	}

	/**
	 * @param int[] $ids
	 * @return array<int, array{id: int, name: string, isSystem?: true}>
	 */
	private function resolveUserNames(array $ids): array
	{
		if (empty($ids))
		{
			return [];
		}

		$out = [];
		$realIds = [];
		foreach ($ids as $id)
		{
			$id = (int)$id;
			if (SystemUser::isSystem($id))
			{
				$out[SystemUser::ID] = [
					'id' => SystemUser::ID,
					'name' => SystemUser::name(),
					'isSystem' => true,
				];
			}
			elseif ($id > 0)
			{
				$realIds[] = $id;
			}
		}

		if ($realIds === [])
		{
			return $out;
		}

		$rows = \Bitrix\Main\UserTable::query()
			->setSelect(['ID', 'NAME', 'LAST_NAME', 'LOGIN'])
			->whereIn('ID', $realIds)
			->setCacheTtl(300)
			->exec();

		while ($row = $rows->fetch())
		{
			$id = (int)$row['ID'];
			$name = trim(((string)($row['NAME'] ?? '')) . ' ' . ((string)($row['LAST_NAME'] ?? '')));
			if ($name === '')
			{
				$name = (string)($row['LOGIN'] ?? ('User #' . $id));
			}
			$out[$id] = ['id' => $id, 'name' => $name];
		}

		return $out;
	}
}

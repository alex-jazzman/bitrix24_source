<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Exceptions\AccessDeniedException;
use Bitrix\Note\Internal\Exceptions\CollectionNotFoundException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Exceptions\DocumentNotFoundException;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Model\Collection;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Entity\RecycleBin\RecycleBinRecord;
use Bitrix\Note\Internal\Model\CollectionTable;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Service\Sidebar\DirectOpenContextService;
use Bitrix\Note\Public\Command\ArchiveDocumentCommand;
use Bitrix\Note\Public\Command\CreateDocumentCommand;
use Bitrix\Note\Public\Command\DeleteAllArchivedDocumentsCommand;
use Bitrix\Note\Public\Command\DeleteDocumentCommand;
use Bitrix\Note\Public\Command\MoveDocumentCommand;
use Bitrix\Note\Public\Command\RestoreAllArchivedDocumentsCommand;
use Bitrix\Note\Public\Command\RestoreDocumentCommand;
use Bitrix\Note\Public\Command\UpdateDocumentCommand;
use Bitrix\Note\Public\Provider\CollaborationProvider;
use Bitrix\Note\Public\Provider\CollectionProvider;
use Bitrix\Note\Public\Provider\DocumentProvider;
use Bitrix\Note\Public\Provider\TreeProvider;

class DocumentController extends Controller
{
	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new ActionFilter\NoteAccess(),
			],
		);
	}

	public function createAction(
		int $collectionId,
		string $title,
		?int $parentId = null
	): ?array
	{
		if (!$this->assertCollectionManageAccess($collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		try
		{
			$result = (new CreateDocumentCommand($collectionId, $parentId, $title, '', $userId))->run();
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_CREATE_ERROR')));

			return null;
		}

		$document = $result->getData()['document'] ?? null;
		if (!$document instanceof Document)
		{
			return null;
		}

		return $this->mapDocumentMeta($document);
	}

	public function updateAction(int $id, ?string $title = null): ?array
	{
		$existingDocument = (new DocumentProvider())->getMetaById($id);
		if ($existingDocument === null || !$this->assertDocumentEditAccess($id, (int)$existingDocument->getCollectionId()))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		try
		{
			$result = (new UpdateDocumentCommand($id, $title, $userId))->run();
		}
		catch (DocumentInRecycleBinException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASHED'), 'DOCUMENT_TRASHED'));

			return null;
		}
		catch (DocumentArchivedException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_ARCHIVED')));

			return null;
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_UPDATE_ERROR')));

			return null;
		}
		$document = $result->getData()['document'] ?? null;
		if (!$document instanceof Document)
		{
			return null;
		}

		return $this->mapDocumentMeta($document);
	}

	public function moveAction(int $id, int $collectionId, ?int $parentId = null, ?int $position = null): ?array
	{
		$existingDocument = (new DocumentProvider())->getMetaById($id);
		if ($existingDocument === null)
		{
			return null;
		}

		if (
			!$this->assertCollectionManageAccess($existingDocument->getCollectionId())
			|| !$this->assertCollectionManageAccess($collectionId)
		)
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		try
		{
			$result = (new MoveDocumentCommand($id, $collectionId, $parentId, $position, $userId))->run();
		}
		catch (DocumentInRecycleBinException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASHED'), 'DOCUMENT_TRASHED'));

			return null;
		}
		catch (DocumentArchivedException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_ARCHIVED')));

			return null;
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_MOVE_ERROR')));

			return null;
		}
		$data = $result->getData();
		$document = $data['document'] ?? null;
		if (!$document instanceof Document)
		{
			return null;
		}

		$documentId = (int)$document->getId();
		// MoveDocumentCommand performed the single full read needed for the title — reuse it
		// here instead of issuing another getById.
		$fullDocument = $data['fullDocument'] ?? null;
		if (!$fullDocument instanceof Document)
		{
			return null;
		}

		$collectionIdOut = (int)$fullDocument->getCollectionId();
		$childrenCountMap = (new DocumentRepository())->getChildrenCountMapByParentIds(
			$collectionIdOut,
			[$documentId],
		);

		return [
			'id' => $documentId,
			'collectionId' => $collectionIdOut,
			'parentId' => $fullDocument->getParentId(),
			'position' => $fullDocument->getPosition(),
			'title' => $fullDocument->getTitle(),
			'hasChildren' => isset($childrenCountMap[$documentId]),
			'affectedPositions' => $data['affectedPositions'] ?? [],
		];
	}

	public function archiveAction(int $id): ?array
	{
		$ownership = (new DocumentProvider())->getOwnershipInfo($id);
		if ($ownership === null || !$this->assertCollectionManageAccess($ownership['collectionId']))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		try
		{
			(new ArchiveDocumentCommand($id, $userId))->run();
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_ARCHIVE_ERROR')));

			return null;
		}

		return ['id' => $id];
	}

	public function restoreAction(int $id): ?array
	{
		$ownership = (new DocumentProvider())->getOwnershipInfo($id);
		if ($ownership === null || !$this->assertCollectionManageAccess($ownership['collectionId']))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		try
		{
			$result = (new RestoreDocumentCommand($id, $userId))->run();
		}
		catch (DocumentNotFoundException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_RESTORE_ERROR')));

			return null;
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_RESTORE_ERROR')));

			return null;
		}

		$document = $result->getData()['document'] ?? null;
		if (!$document instanceof Document)
		{
			return null;
		}

		$response = $this->mapDocumentMeta($document);
		$restoredCollection = $result->getData()['restoredCollection'] ?? null;
		if ($restoredCollection instanceof Collection)
		{
			$response['restoredCollection'] = (new CollectionProvider())
				->mapCollectionForCurrentUser($restoredCollection)
			;
		}

		return $response;
	}

	public function restoreAllAction(): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		try
		{
			$result = (new RestoreAllArchivedDocumentsCommand($userId))->run();
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_RESTORE_ALL_ERROR')));

			return null;
		}

		$restoredCollections = $result->getData()['restoredCollections'] ?? [];
		$collectionProvider = new CollectionProvider();
		$mappedCollections = [];
		foreach ($restoredCollections as $restoredCollection)
		{
			if ($restoredCollection instanceof Collection)
			{
				$mappedCollections[] = $collectionProvider->mapCollectionForCurrentUser($restoredCollection);
			}
		}

		return [
			'restoredCount' => (int)($result->getData()['restoredCount'] ?? 0),
			'restoredCollections' => $mappedCollections,
		];
	}

	public function deleteAllArchivedAction(): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		try
		{
			$result = (new DeleteAllArchivedDocumentsCommand($userId))->run();
		}
		catch (SystemException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_DELETE_ALL_ARCHIVED_ERROR')));

			return null;
		}

		return [
			'deletedCount' => (int)($result->getData()['deletedCount'] ?? 0),
		];
	}

	public function listArchivedAction(int $limit = 50, ?array $afterCursor = null): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$limit = max(1, min(200, $limit));
		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		return (new DocumentProvider())->getArchivedForUser($accessCodes, $userId, $limit, $afterCursor);
	}

	public function deleteAction(int $id): ?bool
	{
		$ownership = (new DocumentProvider())->getOwnershipInfo($id);
		if ($ownership === null || !$this->assertCollectionManageAccess($ownership['collectionId']))
		{
			return null;
		}

		$result = (new DeleteDocumentCommand($id, (int)$this->getCurrentUser()->getId()))->run();

		return (bool)($result->getData()['success'] ?? false);
	}

	public function getAction(int $id): ?array
	{
		$document = (new DocumentProvider())->getById($id);
		if ($document === null)
		{
			return null;
		}

		$recycleBinRepository = new RecycleBinRepository();
		$trashRecord = $recycleBinRepository->getByDocumentId($id);
		if ($trashRecord !== null)
		{
			$userId = (int)$this->getCurrentUser()->getId();
			if (!DocumentAccessService::canViewInRecycleBin($userId, $trashRecord))
			{
				$this->denyAccess();

				return null;
			}

			$canRestore = DocumentAccessService::canRestoreFromRecycleBin($userId, $trashRecord);
			$canHardDelete = DocumentAccessService::canHardDeleteFromRecycleBin($userId, $trashRecord);

			return $this->mapTrashedDocument($document, $trashRecord, $canRestore, $canHardDelete);
		}

		$collectionId = (int)$document->getCollectionId();
		$isArchived = (bool)$document->getIsArchived();
		$snapshot = DocumentAccessService::getCurrentUserSnapshot($id, $collectionId, $isArchived);
		if (!$snapshot['canView'])
		{
			$this->denyAccess();

			return null;
		}

		return $this->mapDocument($document, $snapshot);
	}

	public function getOpenContextAction(int $id): ?array
	{
		return (new DirectOpenContextService())->resolve($id);
	}

	public function listSharedWithMeAction(int $limit = 50, ?array $afterCursor = null): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$limit = max(1, min(200, $limit));
		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);

		return (new DocumentProvider())->getSharedWithMe($accessCodes, $limit, $afterCursor);
	}

	public function getPermissionsAction(int $id): ?array
	{
		$document = (new DocumentProvider())->getMetaById($id);
		if ($document === null)
		{
			return null;
		}

		$collectionId = (int)$document->getCollectionId();
		if (!$this->assertDocumentPermissionsAccess($collectionId))
		{
			return null;
		}

		return [
			'documentId' => $id,
			'permissions' => DocumentAccessService::getDocumentPermissions($id),
		];
	}

	public function getMyAccessAction(int $id): array
	{
		$document = (new DocumentProvider())->getMetaById($id);
		if ($document === null)
		{
			// Lost-access path: caller knows the document id but can no longer resolve it.
			// Return a fully-locked snapshot so the editor can tear down without leaking metadata.
			return [
				'documentId' => $id,
				'collectionId' => null,
				'canView' => false,
				'canEdit' => false,
				'canViewCollection' => false,
				'canEditCollection' => false,
				'canManagePermissions' => false,
				'sharedAccess' => true,
				'recycleBinId' => null,
				'trashedAt' => null,
				'canRestore' => false,
				'canHardDelete' => false,
				'isOrphan' => false,
			];
		}

		$collectionId = (int)$document->getCollectionId();

		// Trashed documents resolve access via the recycle-bin gate (mirrors getAction):
		// the author / trasher keep view access on an orphaned doc even after the source
		// collection — and thus the normal ACL path — is gone. Trashed docs are read-only.
		$trashRecord = (new RecycleBinRepository())->getByDocumentId($id);
		if ($trashRecord !== null)
		{
			$userId = (int)$this->getCurrentUser()->getId();
			$canView = DocumentAccessService::canViewInRecycleBin($userId, $trashRecord);
			$trashedAt = $trashRecord->getTrashedAt();

			// Action flags power the in-editor more-menu after a push-driven mode flip.
			// Outsiders get false-everything together with canView so they cannot enumerate trash rows.
			$canRestore = $canView && DocumentAccessService::canRestoreFromRecycleBin($userId, $trashRecord);
			$canHardDelete = $canView && DocumentAccessService::canHardDeleteFromRecycleBin($userId, $trashRecord);

			// Orphan-state mirrors mapTrashedDocument's logic — banner copy depends on it.
			$rawCollectionId = (int)$document->getCollectionId();
			$isOrphan = $rawCollectionId <= 0 || !$this->collectionExists($rawCollectionId);

			return [
				'documentId' => $id,
				'collectionId' => null,
				'canView' => $canView,
				'canEdit' => false,
				'canViewCollection' => false,
				'canEditCollection' => false,
				'canManagePermissions' => false,
				'sharedAccess' => true,
				// Editor uses these to power the in-place restore banner after a cascade trash
				// arrives via NOTE_COLLECTION_{id} without a per-doc payload — record is already
				// loaded above, so this is a free exposure.
				'recycleBinId' => $canView ? (int)$trashRecord->getId() : null,
				'trashedAt' => $canView ? $trashedAt->format('Y-m-d H:i:s') : null,
				'canRestore' => $canRestore,
				'canHardDelete' => $canHardDelete,
				'isOrphan' => $canView && $isOrphan,
			];
		}

		$snapshot = DocumentAccessService::getCurrentUserSnapshot($id, $collectionId);

		return [
			'documentId' => $id,
			// Hide collection id when the user has no document access — same privacy rule as DocumentReadDto.
			'collectionId' => ($snapshot['canView'] ?? false) ? $collectionId : null,
			'canView' => (bool)($snapshot['canView'] ?? false),
			'canEdit' => (bool)($snapshot['canEdit'] ?? false),
			'canViewCollection' => (bool)($snapshot['canViewCollection'] ?? false),
			'canEditCollection' => (bool)($snapshot['canEditCollection'] ?? false),
			'canManagePermissions' => (bool)($snapshot['canManagePermissions'] ?? false),
			'sharedAccess' => (bool)($snapshot['sharedAccess'] ?? true),
			'recycleBinId' => null,
			'trashedAt' => null,
			'canRestore' => false,
			'canHardDelete' => false,
			'isOrphan' => false,
		];
	}

	public function savePermissionsAction(int $id, array $permissions = []): ?bool
	{
		$document = (new DocumentProvider())->getMetaById($id);
		if ($document === null)
		{
			return null;
		}

		$collectionId = (int)$document->getCollectionId();
		if (!$this->assertDocumentPermissionsAccess($collectionId))
		{
			return null;
		}

		$result = DocumentAccessService::replaceDocumentPermissions(
			$id,
			$permissions,
			(int)$this->getCurrentUser()->getId(),
		);

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return true;
	}

	public function getTreeAction(int $collectionId): ?array
	{
		try
		{
			$result = (new TreeProvider())->getAccessibleTree($collectionId);
		}
		catch (CollectionNotFoundException)
		{
			return null;
		}
		catch (AccessDeniedException)
		{
			$this->denyAccess();

			return null;
		}

		return $result['items'];
	}

	public function listByCollectionAction(
		int $collectionId,
		bool $ownedByMe = false,
		int $limit = 50,
		?array $afterCursor = null,
		bool $rootsOnly = false,
	): ?array
	{
		$userId = (int)$this->getCurrentUser()->getId();
		if ($userId <= 0)
		{
			return null;
		}

		$limit = max(1, min(200, $limit));

		try
		{
			return (new DocumentProvider())->getListByCollection(
				$collectionId,
				$ownedByMe,
				$userId,
				$limit,
				$afterCursor,
				$rootsOnly,
			);
		}
		catch (CollectionNotFoundException)
		{
			$this->addError(new Error(
				(string)(Loc::getMessage('NOTE_COLLECTION_NOT_FOUND')),
				'COLLECTION_NOT_FOUND',
			));

			return null;
		}
		catch (AccessDeniedException)
		{
			$this->addError(new Error(
				(string)(Loc::getMessage('NOTE_ACCESS_DENIED')),
				'ACCESS_DENIED',
			));

			return null;
		}
	}

	public function listByParentAction(
		int $collectionId,
		?int $parentId = null,
		int $limit = 50,
		?int $afterPosition = null,
		?int $afterId = null,
	): ?array
	{
		if (!$this->assertCollectionViewAccess($collectionId))
		{
			return null;
		}

		return (new TreeProvider())->getListByParent($collectionId, $parentId, $limit, $afterPosition, $afterId);
	}

	private function mapDocumentMeta(Document $document): array
	{
		return [
			'id' => $document->getId(),
			'collectionId' => $document->getCollectionId(),
			'parentId' => $document->getParentId(),
			'title' => $document->getTitle(),
			'position' => $document->getPosition(),
			'isArchived' => $document->getIsArchived(),
		];
	}

	private function mapDocument(Document $document, ?array $snapshot = null): array
	{
		$documentId = (int)$document->getId();
		$collectionId = (int)$document->getCollectionId();
		$userId = (int)$this->getCurrentUser()->getId();
		$isArchived = (bool)$document->getIsArchived();

		$snapshot ??= DocumentAccessService::getCurrentUserSnapshot($documentId, $collectionId, $isArchived);
		$canEdit = $snapshot['canEdit'];
		$sharedAccess = $snapshot['sharedAccess'];
		$canEditCollection = $snapshot['canEditCollection'];
		$canManagePermissions = $snapshot['canManagePermissions'];

		$collabMeta = (new CollaborationProvider())->buildCollaborationMeta(
			$documentId,
			$collectionId,
			$userId,
			$canEdit,
		);

		$archivedAt = $document->getArchivedAt();

		$payload = [
			'id' => $document->getId(),
			'canEdit' => $canEdit,
			'canEditCollection' => $canEditCollection,
			'canManagePermissions' => $canManagePermissions,
			'sharedAccess' => $sharedAccess,
			'parentId' => $document->getParentId(),
			'title' => $document->getTitle(),
			'contentFormat' => $document->getContentFormat(),
			'position' => $document->getPosition(),
			'isArchived' => $isArchived,
			'archivedAt' => $archivedAt !== null ? $archivedAt->format('c') : null,
			'isTrashed' => false,
			'recycleBinId' => null,
			'trashedAt' => null,
			'isOrphan' => false,
			'canRestore' => false,
			'createdBy' => $document->getCreatedBy(),
			'updatedBy' => $document->getUpdatedBy(),
			'createdAt' => $document->getCreatedAt()->format('c'),
			'updatedAt' => $document->getUpdatedAt()->format('c'),
		];

		if (!$sharedAccess)
		{
			$collectionTitle = '';
			$collection = (new CollectionProvider())->getById($collectionId);
			if ($collection !== null)
			{
				$collectionTitle = trim($collection->getName());
			}

			$payload['collectionId'] = $collectionId;
			$payload['collectionTitle'] = $collectionTitle;
			$payload['ancestors'] = $this->buildAncestors($documentId);
		}
		else
		{
			$payload['ancestors'] = [];
		}

		$yjsState = $document->getYjsState();
		if (
			$document->getContentFormat() === DocumentTable::CONTENT_FORMAT_YJS
			&& $yjsState !== null
			&& $yjsState !== ''
		)
		{
			$payload['yjsState'] = $yjsState;
		}
		else
		{
			$payload['markdown'] = $document->getMarkdown();
		}

		if ($collabMeta !== null)
		{
			$payload['collaboration'] = $collabMeta;
		}

		return $payload;
	}

	private function mapTrashedDocument(
		Document $document,
		RecycleBinRecord $record,
		bool $canRestore,
		bool $canHardDelete = false,
	): array
	{
		$rawCollectionId = (int)$document->getCollectionId();
		$collectionAlive = false;
		$collectionTitle = '';
		if ($rawCollectionId > 0)
		{
			$row = CollectionTable::query()
				->setSelect(['ID', 'NAME'])
				->where('ID', $rawCollectionId)
				->fetch()
			;
			if ($row !== false)
			{
				$collectionAlive = true;
				$collectionTitle = (string)($row['NAME'] ?? '');
			}
		}

		$exposedCollectionId = $collectionAlive ? $rawCollectionId : 0;
		$exposedCollectionTitle = $collectionAlive ? $collectionTitle : '';

		$payload = [
			'id' => (int)$document->getId(),
			'canEdit' => false,
			'canEditCollection' => false,
			'canManagePermissions' => false,
			'sharedAccess' => false,
			'parentId' => $document->getParentId(),
			'title' => $document->getTitle(),
			'contentFormat' => $document->getContentFormat(),
			'position' => $document->getPosition(),
			'isArchived' => (bool)$document->getIsArchived(),
			'archivedAt' => $document->getArchivedAt()?->format('c'),
			'isTrashed' => true,
			'recycleBinId' => (int)$record->getId(),
			'trashedAt' => $record->getTrashedAt()->format('c'),
			'isOrphan' => !$collectionAlive,
			'canRestore' => $canRestore,
			'canHardDelete' => $canHardDelete,
			'createdBy' => $document->getCreatedBy(),
			'updatedBy' => $document->getUpdatedBy(),
			'createdAt' => $document->getCreatedAt()->format('c'),
			'updatedAt' => $document->getUpdatedAt()->format('c'),
			'collectionId' => $exposedCollectionId,
			'collectionTitle' => $exposedCollectionTitle,
			'ancestors' => [],
		];

		$yjsState = $document->getYjsState();
		if (
			$document->getContentFormat() === DocumentTable::CONTENT_FORMAT_YJS
			&& $yjsState !== null
			&& $yjsState !== ''
		)
		{
			$payload['yjsState'] = $yjsState;
		}
		else
		{
			$payload['markdown'] = $document->getMarkdown();
		}

		return $payload;
	}

	private function assertCollectionViewAccess(int $collectionId): bool
	{
		if ($this->hasCollectionLevel($collectionId, CollectionAccessService::LEVEL_VIEW))
		{
			return true;
		}

		$this->denyAccess();

		return false;
	}

	private function assertCollectionManageAccess(int $collectionId): bool
	{
		if ($this->hasCollectionLevel($collectionId, CollectionAccessService::LEVEL_MANAGE))
		{
			return true;
		}

		$this->denyAccess();

		return false;
	}

	private function assertDocumentViewAccess(int $documentId, int $collectionId): bool
	{
		if (DocumentAccessService::currentUserHasLevel($documentId, $collectionId, DocumentAccessService::LEVEL_VIEW))
		{
			return true;
		}

		$this->denyAccess();

		return false;
	}

	private function assertDocumentEditAccess(int $documentId, int $collectionId): bool
	{
		if (DocumentAccessService::currentUserHasLevel($documentId, $collectionId, DocumentAccessService::LEVEL_EDIT))
		{
			return true;
		}

		$this->denyAccess();

		return false;
	}

	private function hasCollectionLevel(int $collectionId, int $requiredLevel): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, $requiredLevel);
	}

	private function assertDocumentPermissionsAccess(int $collectionId): bool
	{
		if (CollectionAccessService::currentUserHasLevel($collectionId, CollectionAccessService::LEVEL_MODERATE))
		{
			return true;
		}

		$this->denyAccess();

		return false;
	}

	private function denyAccess(): void
	{
		$this->addError(new Error((string)(Loc::getMessage('NOTE_ACCESS_DENIED'))));
	}

	private function collectionExists(int $collectionId): bool
	{
		if ($collectionId <= 0)
		{
			return false;
		}

		$row = CollectionTable::query()
			->setSelect(['ID'])
			->where('ID', $collectionId)
			->setLimit(1)
			->fetch()
		;

		return $row !== false;
	}

	/**
	 * @return array<int, array{id:int, title:string}>
	 */
	private function buildAncestors(int $documentId): array
	{
		if ($documentId <= 0)
		{
			return [];
		}

		$path = (new DocumentRepository())->getDocumentPathToRoot($documentId);
		$result = [];
		foreach ($path as $ancestor)
		{
			$id = (int)$ancestor->getId();
			if ($id <= 0)
			{
				continue;
			}

			$result[] = [
				'id' => $id,
				'title' => (string)$ancestor->getTitle(),
			];
		}

		return $result;
	}

}

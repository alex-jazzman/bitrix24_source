<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Error;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\Web\Json;
use Bitrix\Note\Internal\Access\Service\DocumentAccessService;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Public\Command\CompactDocumentCommand;
use Bitrix\Note\Public\Command\SavePatchCommand;
use Bitrix\Note\Public\Command\SaveYjsStateCommand;
use Bitrix\Note\Public\Provider\CollaborationProvider;

class CollaborationSyncController extends Controller
{
	private ?DocumentRepository $documentRepository = null;

	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new ActionFilter\NoteAccess(),
			],
		);
	}

	public function loadForCollaborationAction(int $documentId): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentViewAccess($documentId, $collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		return (new CollaborationProvider())->loadForCollaboration($documentId, $userId);
	}

	public function loadPatchesAction(int $documentId): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentViewAccess($documentId, $collectionId))
		{
			return null;
		}

		return (new CollaborationProvider())->loadPatches($documentId);
	}

	public function savePatchAction(int $documentId, string $patch, ?string $cursor = null): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentEditAccess($documentId, $collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		try
		{
			$result = (new SavePatchCommand($documentId, $userId, $patch, $cursor))->run();
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_SAVE_ERROR')));

			return null;
		}

		if (!$result->isSuccess())
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_SAVE_ERROR')));

			return null;
		}

		return ['success' => true];
	}

	public function compactAction(int $documentId, string $markdown, int $processedUpToId, ?string $yjsState = null): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentEditAccess($documentId, $collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		try
		{
			$result = (new CompactDocumentCommand($documentId, $userId, $markdown, $processedUpToId, $yjsState))->run();
		}
		catch (DocumentArchivedException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_ARCHIVED')));

			return null;
		}
		catch (DocumentInRecycleBinException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASHED'), 'DOCUMENT_TRASHED'));

			return null;
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_COMPACT_ERROR')));

			return null;
		}

		$locked = $result->getData()['locked'] ?? false;
		if ($locked)
		{
			return ['locked' => true];
		}

		return ['success' => true];
	}

	public function saveYjsStateAction(int $documentId, string $yjsState): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentEditAccess($documentId, $collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		try
		{
			$result = (new SaveYjsStateCommand($documentId, $userId, $yjsState))->run();
		}
		catch (DocumentArchivedException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_ARCHIVED')));

			return null;
		}
		catch (DocumentInRecycleBinException)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_DOCUMENT_TRASHED'), 'DOCUMENT_TRASHED'));

			return null;
		}
		catch (SystemException $e)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_SAVE_ERROR')));

			return null;
		}

		if (!$result->isSuccess())
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_SAVE_ERROR')));

			return null;
		}

		$data = $result->getData();

		return [
			'success' => true,
			// applied=false → a concurrent client already saved genesis; yjsState carries it
			// so the late client can rebuild its Y.Doc onto the shared baseline.
			'applied' => (bool)($data['applied'] ?? true),
			'yjsState' => $data['yjsState'] ?? null,
		];
	}

	public function sendAwarenessAction(int $documentId, string $awareness): ?array
	{
		$collectionId = $this->resolveCollectionId($documentId);
		if ($collectionId === null)
		{
			return null;
		}

		if (!$this->assertDocumentViewAccess($documentId, $collectionId))
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		try
		{
			$data = Json::decode($awareness);
		}
		catch (\Exception)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_AWARENESS_ERROR')));

			return null;
		}

		(new PushNotificationService())->sendAwareness($documentId, $userId, $data);

		return ['success' => true];
	}

	private function resolveCollectionId(int $documentId): ?int
	{
		$document = $this->getDocumentRepository()->getMetaById($documentId, ['ID', 'COLLECTION_ID']);
		if ($document === null)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_SYNC_DOCUMENT_NOT_FOUND')));

			return null;
		}

		return $document->getCollectionId();
	}

	private function getDocumentRepository(): DocumentRepository
	{
		$this->documentRepository ??= new DocumentRepository();

		return $this->documentRepository;
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

	private function denyAccess(): void
	{
		$this->addError(new Error((string)(Loc::getMessage('NOTE_COLLABORATION_SYNC_ACCESS_DENIED'))));
	}
}

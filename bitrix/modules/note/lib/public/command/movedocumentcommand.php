<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Model\Document;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Document\Position\PositionService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class MoveDocumentCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $collectionId;
	private readonly ?int $parentId;
	private readonly ?int $position;
	private readonly int $userId;
	private readonly PositionService $positionService;
	private readonly DocumentRepository $repository;
	private readonly RecycleBinFilter $recycleBinFilter;
	private readonly PushNotificationService $pushService;

	public function __construct(
		int $id,
		int $collectionId,
		?int $parentId,
		?int $position,
		int $userId,
		?PositionService $positionService = null,
		?DocumentRepository $repository = null,
		?RecycleBinFilter $recycleBinFilter = null,
		?PushNotificationService $pushService = null,
	)
	{
		$this->id = $id;
		$this->collectionId = $collectionId;
		$this->parentId = $parentId;
		$this->position = $position;
		$this->userId = $userId;
		$this->positionService = $positionService ?? new PositionService();
		$this->repository = $repository ?? new DocumentRepository();
		$this->recycleBinFilter = $recycleBinFilter ?? new RecycleBinFilter();
		$this->pushService = $pushService ?? new PushNotificationService();
	}

	protected function execute(): Result
	{
		if ($this->recycleBinFilter->isInRecycleBin($this->id))
		{
			throw new DocumentInRecycleBinException();
		}

		$document = $this->repository->getById($this->id);
		if ($document !== null && $document->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$sourceCollectionId = $document !== null ? (int)$document->getCollectionId() : null;
		$sourceParentId = $document !== null ? $document->getParentId() : null;

		if ($this->parentId !== null)
		{
			if ($this->recycleBinFilter->isInRecycleBin($this->parentId))
			{
				throw new DocumentInRecycleBinException();
			}

			$parent = $this->repository->getById($this->parentId);
			if ($parent !== null && $parent->getIsArchived())
			{
				throw new DocumentArchivedException();
			}
		}

		$result = $this->positionService->move(
			$this->id,
			$this->collectionId,
			$this->parentId,
			$this->position,
			$this->userId,
		);
		if (!$result->isSuccess())
		{
			throw new SystemException($this->buildSaveErrorMessage($result, 'Unable to move document.'));
		}

		$data = $result->getData();
		$document = $data['document'] ?? null;
		$affectedPositions = $data['affectedPositions'] ?? [];

		if ($document === null)
		{
			return $this->createResult(['document' => null, 'affectedPositions' => $affectedPositions]);
		}

		if (!$document instanceof Document)
		{
			throw new SystemException('Unable to move document.');
		}

		// PositionService returns a meta-only Document (ID/COLLECTION_ID/PARENT_ID/POSITION).
		// Reload full record once — reused both for the push payload (title) and the action response.
		$fullDocument = $this->repository->getById((int)$document->getId());

		$this->emitDocumentMove($document, $fullDocument, $affectedPositions, $sourceCollectionId, $sourceParentId);

		return $this->createResult([
			'document' => $document,
			'fullDocument' => $fullDocument,
			'affectedPositions' => $affectedPositions,
		]);
	}

	private function emitDocumentMove(
		Document $document,
		?Document $fullDocument,
		array $affectedPositions,
		?int $sourceCollectionId,
		?int $sourceParentId,
	): void
	{
		$documentId = (int)$document->getId();
		$targetCollectionId = (int)$document->getCollectionId();
		$targetParentId = $document->getParentId();
		$finalPosition = (int)$document->getPosition();
		$title = $fullDocument !== null ? (string)$fullDocument->getTitle() : '';

		$hasChildren = $this->repository->hasChildren($targetCollectionId, $documentId);
		$fromParentHasChildren = ($sourceParentId !== null && $sourceCollectionId !== null)
			? $this->repository->hasChildren($sourceCollectionId, $sourceParentId)
			: null;
		$initiatorUserId = $this->userId;
		$pushService = $this->pushService;
		$threshold = PushNotificationService::REALTIME_BATCH_THRESHOLD;
		$requestRefetch = count($affectedPositions) > $threshold;

		$payload = [
			'documentId' => $documentId,
			'collectionId' => $targetCollectionId,
			'parentId' => $targetParentId,
			'position' => $finalPosition,
			'title' => $title,
			'hasChildren' => $hasChildren,
			'fromCollectionId' => $sourceCollectionId,
			'fromParentId' => $sourceParentId,
		];
		if ($fromParentHasChildren !== null)
		{
			$payload['fromParentHasChildren'] = $fromParentHasChildren;
		}
		if ($requestRefetch)
		{
			$payload['requestRefetch'] = true;
		}
		else
		{
			$payload['affectedPositions'] = $affectedPositions;
		}

		$collectionsToNotify = [$targetCollectionId];
		if ($sourceCollectionId !== null && $sourceCollectionId !== $targetCollectionId)
		{
			$collectionsToNotify[] = $sourceCollectionId;
		}

		$pushService->dispatchAfterCommit(static function () use (
			$pushService, $payload, $collectionsToNotify, $documentId, $initiatorUserId,
		): void {
			foreach ($collectionsToNotify as $collectionId)
			{
				$pushService->sendToCollection($collectionId, 'documentMove', $payload, $initiatorUserId);
			}
			$pushService->sendToDocument($documentId, 'documentMove', $payload, $initiatorUserId);
		});
	}

	private function createResult(array $data = []): Result
	{
		$result = new Result();
		if (!empty($data))
		{
			$result->setData($data);
		}

		return $result;
	}

	private function buildSaveErrorMessage(Result $saveResult, string $defaultMessage): string
	{
		$messages = $saveResult->getErrorMessages();

		return empty($messages) ? $defaultMessage : implode(', ', $messages);
	}
}

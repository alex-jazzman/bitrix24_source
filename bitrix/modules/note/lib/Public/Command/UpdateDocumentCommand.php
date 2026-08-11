<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Document\DocumentService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class UpdateDocumentCommand extends AbstractCommand
{
	private readonly DocumentService $documentService;
	private readonly DocumentRepository $repository;
	private readonly RecycleBinFilter $recycleBinFilter;
	private readonly PushNotificationService $pushService;

	public function __construct(
		private readonly int $id,
		private readonly ?string $title,
		private readonly int $userId,
		?DocumentService $documentService = null,
		?DocumentRepository $repository = null,
		?RecycleBinFilter $recycleBinFilter = null,
		?PushNotificationService $pushService = null,
		// REST writes are out-of-band: notify the initiator's own sessions instead of skipping them.
		private readonly bool $notifyInitiator = false,
	)
	{
		$this->documentService = $documentService ?? new DocumentService();
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

		$existing = $this->repository->getById($this->id);
		if ($existing !== null && $existing->getIsArchived())
		{
			throw new DocumentArchivedException();
		}

		$document = $this->documentService->update(
			id: $this->id,
			title: $this->title,
			markdown: null,
			userId: $this->userId,
		);

		if ($document !== null)
		{
			$documentId = (int)$document->getId();
			$collectionId = (int)$document->getCollectionId();
			$title = (string)$document->getTitle();
			$initiatorUserId = $this->notifyInitiator ? null : $this->userId;
			$pushService = $this->pushService;

			$pushService->dispatchAfterCommit(static function () use (
				$pushService,
				$documentId,
				$collectionId,
				$title,
				$initiatorUserId,
			): void {
				$payload = [
					'documentId' => $documentId,
					'collectionId' => $collectionId,
					'title' => $title,
				];
				$pushService->sendToCollection($collectionId, 'documentUpdate', $payload, $initiatorUserId);
				$pushService->sendToDocument($documentId, 'documentUpdate', $payload, $initiatorUserId);
			});
		}

		$result = new Result();
		$result->setData(['document' => $document]);

		return $result;
	}
}

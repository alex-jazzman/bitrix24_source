<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Document\DocumentService;

class CreateDocumentCommand extends AbstractCommand
{
	private readonly int $collectionId;
	private readonly ?int $parentId;
	private readonly string $title;
	private readonly string $markdown;
	private readonly int $userId;
	private readonly string $contentFormat;
	private readonly DocumentService $documentService;
	private readonly PushNotificationService $pushService;
	private readonly bool $notifyInitiator;

	public function __construct(
		int $collectionId,
		?int $parentId,
		string $title,
		string $markdown,
		int $userId,
		string $contentFormat = DocumentTable::CONTENT_FORMAT_YJS,
		?DocumentService $documentService = null,
		?PushNotificationService $pushService = null,
		// REST writes are out-of-band: notify the initiator's own sessions instead of skipping them.
		bool $notifyInitiator = false,
	)
	{
		$this->collectionId = $collectionId;
		$this->parentId = $parentId;
		$this->title = $title;
		$this->markdown = $markdown;
		$this->userId = $userId;
		$this->contentFormat = $contentFormat;
		$this->documentService = $documentService ?? new DocumentService();
		$this->pushService = $pushService ?? new PushNotificationService();
		$this->notifyInitiator = $notifyInitiator;
	}

	protected function execute(): Result
	{
		$document = $this->documentService->create(
			$this->collectionId,
			$this->parentId,
			$this->title,
			$this->markdown,
			$this->userId,
			$this->contentFormat,
		);

		if ($document !== null)
		{
			$this->emitDocumentCreate($document);
		}

		$result = new Result();
		$result->setData(['document' => $document]);

		return $result;
	}

	private function emitDocumentCreate(\Bitrix\Note\Internal\Model\Document $document): void
	{
		$documentId = (int)$document->getId();
		$collectionId = (int)$document->getCollectionId();
		$parentId = $document->getParentId() !== null ? (int)$document->getParentId() : null;
		$title = (string)$document->getTitle();
		$position = (int)$document->getPosition();
		$initiatorUserId = $this->notifyInitiator ? null : $this->userId;
		$pushService = $this->pushService;

		$pushService->dispatchAfterCommit(static function () use (
			$pushService,
			$documentId,
			$collectionId,
			$parentId,
			$title,
			$position,
			$initiatorUserId,
		): void {
			$pushService->sendToCollection(
				$collectionId,
				'documentCreate',
				[
					'documentId' => $documentId,
					'collectionId' => $collectionId,
					'parentId' => $parentId,
					'title' => $title,
					'position' => $position,
					'hasChildren' => false,
				],
				$initiatorUserId,
			);
		});
	}
}

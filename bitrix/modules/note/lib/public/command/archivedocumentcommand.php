<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class ArchiveDocumentCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $userId;
	private readonly DocumentRepository $repository;
	private readonly SearchIndexService $searchIndexService;
	private readonly PushNotificationService $pushService;
	private readonly bool $notifyInitiator;

	public function __construct(
		int $id,
		int $userId,
		?DocumentRepository $repository = null,
		?SearchIndexService $searchIndexService = null,
		?PushNotificationService $pushService = null,
		// REST writes are out-of-band: notify the initiator's own sessions instead of skipping them.
		bool $notifyInitiator = false,
	)
	{
		$this->id = $id;
		$this->userId = $userId;
		$this->repository = $repository ?? new DocumentRepository();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
		$this->pushService = $pushService ?? new PushNotificationService();
		$this->notifyInitiator = $notifyInitiator;
	}

	protected function execute(): Result
	{
		$document = $this->repository->getMetaById($this->id, ['ID', 'COLLECTION_ID', 'IS_ARCHIVED']);
		if ($document === null || $document->getIsArchived())
		{
			return $this->createResult(['success' => false]);
		}

		$subtreeIds = $this->repository->getSubtreeIds($this->id, (int)$document->getCollectionId());
		if (empty($subtreeIds))
		{
			$subtreeIds = [$this->id];
		}

		$this->repository->archiveByIds($subtreeIds, $this->userId);

		try
		{
			$this->searchIndexService->deindexDocuments($subtreeIds);
		}
		catch (\Throwable)
		{
		}

		$this->emitDocumentArchive((int)$document->getCollectionId(), $subtreeIds);

		return $this->createResult(['success' => true, 'archivedIds' => $subtreeIds]);
	}

	private function emitDocumentArchive(int $collectionId, array $archivedIds): void
	{
		$this->pushService->emitDocumentCascade(
			collectionId: $collectionId,
			documentIds: $archivedIds,
			collectionCommand: 'documentArchive',
			initiatorUserId: $this->notifyInitiator ? null : $this->userId,
		);
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
}

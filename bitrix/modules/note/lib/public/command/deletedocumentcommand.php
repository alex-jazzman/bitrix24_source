<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\RecycleBin\MoveToRecycleBinService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class DeleteDocumentCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $userId;
	private readonly DocumentRepository $repository;
	private readonly RecycleBinRepository $recycleBinRepository;
	private readonly MoveToRecycleBinService $moveService;
	private readonly SearchIndexService $searchIndexService;
	private readonly PushNotificationService $pushService;
	private readonly bool $notifyInitiator;

	public function __construct(
		int $id,
		int $userId = 0,
		?DocumentRepository $repository = null,
		?RecycleBinRepository $recycleBinRepository = null,
		?MoveToRecycleBinService $moveService = null,
		?SearchIndexService $searchIndexService = null,
		?PushNotificationService $pushService = null,
		// REST writes are out-of-band: notify the initiator's own sessions instead of skipping them.
		bool $notifyInitiator = false,
	)
	{
		$this->id = $id;
		$this->userId = $userId;
		$this->repository = $repository ?? new DocumentRepository();
		$this->recycleBinRepository = $recycleBinRepository ?? new RecycleBinRepository();
		$this->moveService = $moveService ?? new MoveToRecycleBinService();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
		$this->pushService = $pushService ?? new PushNotificationService();
		$this->notifyInitiator = $notifyInitiator;
	}

	protected function execute(): Result
	{
		$document = $this->repository->getMetaById($this->id);
		if ($document === null)
		{
			return $this->createResult(['success' => false]);
		}

		if ($this->recycleBinRepository->isInRecycleBin($this->id))
		{
			return $this->createResult(['success' => false]);
		}

		$connection = Application::getConnection();
		$connection->startTransaction();
		try
		{
			$trashedIds = $this->moveService->moveSubtree($this->id, $this->userId);
			$connection->commitTransaction();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();
			throw $e;
		}

		try
		{
			$this->searchIndexService->deindexDocuments($trashedIds);
		}
		catch (\Throwable)
		{
		}

		$this->emitDocumentDelete((int)$document->getCollectionId(), $trashedIds);

		return $this->createResult(['success' => true, 'trashedIds' => $trashedIds]);
	}

	private function emitDocumentDelete(int $collectionId, array $trashedIds): void
	{
		if (empty($trashedIds))
		{
			return;
		}

		$this->pushService->emitDocumentCascade(
			collectionId: $collectionId,
			documentIds: $trashedIds,
			collectionCommand: 'documentDelete',
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

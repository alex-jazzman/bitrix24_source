<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Application;
use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Repository\RecycleBinRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Import\CollectionImportLockService;
use Bitrix\Note\Internal\Service\RecycleBin\MoveToRecycleBinService;
use Bitrix\Note\Internal\Service\Search\SearchIndexService;

class DeleteCollectionCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly int $userId;
	private readonly CollectionRepository $collectionRepository;
	private readonly MoveToRecycleBinService $moveService;
	private readonly SearchIndexService $searchIndexService;
	private readonly CollectionImportLockService $importLockService;
	private readonly PushNotificationService $pushService;
	private readonly RecycleBinRepository $recycleBinRepository;

	public function __construct(
		int $id,
		int $userId = 0,
		?CollectionRepository $collectionRepository = null,
		?MoveToRecycleBinService $moveService = null,
		?SearchIndexService $searchIndexService = null,
		?CollectionImportLockService $importLockService = null,
		?PushNotificationService $pushService = null,
		?RecycleBinRepository $recycleBinRepository = null,
	)
	{
		$this->id = $id;
		$this->userId = $userId;
		$this->collectionRepository = $collectionRepository ?? new CollectionRepository();
		$this->moveService = $moveService ?? new MoveToRecycleBinService();
		$this->searchIndexService = $searchIndexService ?? new SearchIndexService();
		$this->importLockService = $importLockService ?? new CollectionImportLockService();
		$this->pushService = $pushService ?? new PushNotificationService();
		$this->recycleBinRepository = $recycleBinRepository ?? new RecycleBinRepository();
	}

	protected function execute(): Result
	{
		$collection = $this->collectionRepository->getById($this->id);
		if ($collection === null)
		{
			return $this->createResult(['success' => false]);
		}

		$activeSessionId = $this->importLockService->findActiveSessionForCollection($this->id);
		if ($activeSessionId !== null)
		{
			return $this->createResult([
				'success' => false,
				'errorCode' => 'COLLECTION_UNDER_IMPORT',
				'sessionId' => $activeSessionId,
			]);
		}

		$connection = Application::getConnection();
		$connection->startTransaction();
		try
		{
			$trashedIds = $this->moveService->moveCollection($this->id, $this->userId);
			$this->collectionRepository->hardDeleteById($this->id);
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

		$this->emitCollectionDelete($this->id, $trashedIds);

		return $this->createResult([
			'success' => true,
			'trashedIds' => $trashedIds,
		]);
	}

	private function emitCollectionDelete(int $collectionId, array $trashedDocumentIds): void
	{
		// Skip the map when the cascade falls back to requestRefetch — editors will
		// pick up recycleBinId/trashedAt via the getMyAccess refetch path instead.
		$extra = [];
		if (count($trashedDocumentIds) <= PushNotificationService::REALTIME_BATCH_THRESHOLD)
		{
			$map = $this->recycleBinRepository->getIdsByDocumentIds($trashedDocumentIds);
			if (!empty($map))
			{
				$extra['recycleBinMap'] = $map;
			}
		}

		$this->pushService->emitDocumentCascade(
			collectionId: $collectionId,
			documentIds: $trashedDocumentIds,
			collectionCommand: 'collectionDelete',
			collectionPayloadExtra: $extra,
			globalCommand: 'collectionDelete',
			globalPayload: ['collectionId' => $collectionId],
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

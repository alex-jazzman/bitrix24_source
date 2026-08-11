<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collection;

use Bitrix\Main\Result;
use Bitrix\Note\Internal\Model\Collection;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;

class CollectionRestoreService
{
	private readonly CollectionRepository $collectionRepository;
	private readonly PushNotificationService $pushService;

	public function __construct(
		?CollectionRepository $collectionRepository = null,
		?PushNotificationService $pushService = null,
	)
	{
		$this->collectionRepository = $collectionRepository ?? new CollectionRepository();
		$this->pushService = $pushService ?? new PushNotificationService();
	}

	public function restore(int $collectionId, int $userId = 0): Result
	{
		$result = new Result();

		if ($collectionId <= 0)
		{
			$result->setData(['transitioned' => false, 'collection' => null]);

			return $result;
		}

		$collection = $this->collectionRepository->getById($collectionId);
		if ($collection === null)
		{
			$result->setData(['transitioned' => false, 'collection' => null]);

			return $result;
		}

		if (!$collection->getIsArchived())
		{
			// Idempotent short-circuit — no push, no DB write.
			$result->setData(['transitioned' => false, 'collection' => $collection]);

			return $result;
		}

		$this->collectionRepository->restoreById($collectionId);
		$restored = $this->collectionRepository->getById($collectionId);

		$this->emitCollectionRestore($collectionId, $restored);

		$result->setData([
			'transitioned' => true,
			'collection' => $restored,
		]);

		return $result;
	}

	private function emitCollectionRestore(int $collectionId, ?Collection $collection): void
	{
		$pushService = $this->pushService;
		$payload = [
			'collectionId' => $collectionId,
			'name' => $collection !== null ? (string)$collection->getName() : '',
			'position' => $collection !== null ? (int)$collection->getPosition() : 0,
			'policyLevel' => $collection !== null ? (int)$collection->getPolicyLevel() : 0,
		];

		$pushService->dispatchAfterCommit(static function () use ($pushService, $payload): void {
			$pushService->sendGlobal('collectionRestore', $payload);
		});
	}
}

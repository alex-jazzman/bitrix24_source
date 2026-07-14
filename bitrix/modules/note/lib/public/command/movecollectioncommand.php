<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;
use Bitrix\Note\Internal\Service\Collection\CollectionPositionService;

final class MoveCollectionCommand extends AbstractCommand
{
	private readonly int $id;
	private readonly ?int $position;
	private readonly int $userId;
	private readonly CollectionPositionService $positionService;
	private readonly PushNotificationService $pushService;

	public function __construct(
		int $id,
		?int $position,
		int $userId,
		?CollectionPositionService $positionService = null,
		?PushNotificationService $pushService = null,
	)
	{
		$this->id = $id;
		$this->position = $position;
		$this->userId = $userId;
		$this->positionService = $positionService ?? new CollectionPositionService();
		$this->pushService = $pushService ?? new PushNotificationService();
	}

	protected function execute(): Result
	{
		$result = $this->positionService->move($this->id, $this->position, $this->userId);
		if (!$result->isSuccess())
		{
			throw new SystemException(
				implode(', ', $result->getErrorMessages()) ?: 'Unable to move collection.'
			);
		}

		$affected = $result->getData()['affectedPositions'] ?? [];
		if (is_array($affected) && $affected !== [])
		{
			$this->emitCollectionMove($affected);
		}

		return $result;
	}

	private function emitCollectionMove(array $affectedPositions): void
	{
		$initiatorUserId = $this->userId;
		$pushService = $this->pushService;

		$payload = count($affectedPositions) > PushNotificationService::REALTIME_BATCH_THRESHOLD
			? ['requestRefetch' => true]
			: ['affectedPositions' => array_values($affectedPositions)];

		$pushService->dispatchAfterCommit(static function () use ($pushService, $payload, $initiatorUserId): void {
			$pushService->sendGlobal('collectionMove', $payload, $initiatorUserId);
		});
	}
}

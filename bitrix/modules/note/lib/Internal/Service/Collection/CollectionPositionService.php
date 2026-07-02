<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collection;

use Bitrix\Main\Application;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Repository\CollectionRepository;
use Bitrix\Note\Internal\Service\Document\Position\PositionCalculator;

final class CollectionPositionService
{
	private readonly CollectionRepository $repository;
	private readonly PositionCalculator $calculator;

	public function __construct(
		?CollectionRepository $repository = null,
		?PositionCalculator $calculator = null,
	)
	{
		$this->repository = $repository ?? new CollectionRepository();
		$this->calculator = $calculator ?? new PositionCalculator();
	}

	public function move(int $collectionId, ?int $targetPosition, int $userId): Result
	{
		$result = new Result();

		if ($collectionId <= 0)
		{
			$result->addError(new Error('Invalid collection id.'));

			return $result;
		}

		$collection = $this->repository->getById($collectionId);
		if ($collection === null)
		{
			return $result;
		}

		$connection = Application::getConnection();
		$connection->startTransaction();

		try
		{
			$rows = $this->repository->getActivePositions();
			$siblingPositions = $this->extractSiblingPositions($rows, $collectionId);

			$renumbered = [];
			$newPosition = $this->calculator->calculateGapPosition($siblingPositions, $targetPosition);
			if ($newPosition === null)
			{
				$renumbered = $this->renumber($rows, $userId);
				$rows = $this->repository->getActivePositions();
				$siblingPositions = $this->extractSiblingPositions($rows, $collectionId);
				$newPosition = $this->calculator->calculateGapPosition($siblingPositions, $targetPosition);
			}

			if ($newPosition === null)
			{
				$connection->rollbackTransaction();
				$result->addError(new Error('Unable to calculate collection position.'));

				return $result;
			}

			if (!$this->repository->updatePosition($collectionId, $newPosition, $userId))
			{
				$connection->rollbackTransaction();
				$result->addError(new Error('Failed to update collection position.'));

				return $result;
			}

			$connection->commitTransaction();

			// Final position of the dragged collection always wins over an earlier renumber entry for the same id.
			$renumbered[$collectionId] = $newPosition;
			$affected = [];
			foreach ($renumbered as $id => $position)
			{
				$affected[] = ['id' => (int)$id, 'position' => (int)$position];
			}

			$result->setData([
				'position' => $newPosition,
				'affectedPositions' => $affected,
			]);

			return $result;
		}
		catch (\Throwable)
		{
			try
			{
				$connection->rollbackTransaction();
			}
			catch (\Throwable)
			{
			}

			$result->addError(new Error('Collection position operation failed.'));

			return $result;
		}
	}

	private function extractSiblingPositions(array $rows, int $excludeId): array
	{
		$positions = [];
		foreach ($rows as $row)
		{
			if ((int)$row['id'] === $excludeId)
			{
				continue;
			}

			$positions[] = (int)$row['position'];
		}

		return $positions;
	}

	private function renumber(array $rows, int $userId): array
	{
		$changes = [];
		$total = count($rows);
		foreach (array_values($rows) as $index => $row)
		{
			$id = (int)$row['id'];
			$desiredPosition = $this->calculator->calculateSequentialPosition($total - 1 - $index);
			if ((int)$row['position'] !== $desiredPosition)
			{
				$this->repository->updatePosition($id, $desiredPosition, $userId);
				$changes[$id] = $desiredPosition;
			}
		}

		return $changes;
	}
}

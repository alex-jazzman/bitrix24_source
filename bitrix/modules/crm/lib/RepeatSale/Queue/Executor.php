<?php

namespace Bitrix\Crm\RepeatSale\Queue;

use Bitrix\Crm\RepeatSale\AvailabilityChecker;
use Bitrix\Crm\RepeatSale\Job\Controller\RepeatSaleJobController;
use Bitrix\Crm\RepeatSale\Queue\Controller\RepeatSaleQueueController;
use Bitrix\Crm\RepeatSale\Queue\Entity\RepeatSaleQueue;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\RepeatSale\Segment\SegmentManager;
use Bitrix\Crm\RepeatSale\Service\Context;
use Bitrix\Crm\RepeatSale\Service\Handler\Factory;
use Bitrix\Crm\RepeatSale\Service\Handler\Result;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Error;
use Bitrix\Main\Type\DateTime;

final class Executor
{
	use Singleton;

	private const ENTITY_ITEMS_LIMIT = 100;
	private const ENTITY_ITEMS_ONLY_CALC_LIMIT = 500;
	private const MAX_RETRY_COUNT = 3;
	private ?RepeatSaleQueueController $controller = null;
	private ?AvailabilityChecker $availabilityChecker = null;

	public function execute(): void
	{
		$availabilityChecker = $this->getAvailabilityChecker();
		if (!$availabilityChecker->isEnabled())
		{
			return;
		}

		$itemEntity = $this->getSuitableQueueItemEntity();

		if ($itemEntity === null)
		{
			if ($availabilityChecker->isSegmentsInitializationProgress())
			{
				$this->updateFlowToPending();
			}

			return;
		}

		$segmentId = $itemEntity['JOB']['SEGMENT_ID'] ?? 0;
		$item = QueueItem::createFromEntity($itemEntity);

		$this->markQueueItemAsProgress($item);

		$result = $this->getQueueItemExecutionResult($item, $segmentId);
		if (!$result->isSuccess())
		{
			$this->processErrorQueueItem($item);

			return;
		}

		if ($this->isQueueItemCompleted($result))
		{
			$this->onQueueItemCompleted($item, $result);
			$this->deleteFromQueue($item);

			return;
		}

		$this->updateQueueItemForNextIteration($item, $result);
	}

	private function getController(): RepeatSaleQueueController
	{
		if ($this->controller === null)
		{
			$this->controller = RepeatSaleQueueController::getInstance();
		}

		return $this->controller;
	}

	private function getAvailabilityChecker(): AvailabilityChecker
	{
		if ($this->availabilityChecker === null)
		{
			$this->availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();
		}

		return $this->availabilityChecker;
	}

	private function getSuitableQueueItemEntity(): ?RepeatSaleQueue
	{
		$collection = $this->getController()->getList([
			'select' => ['*', 'JOB.SEGMENT_ID', 'JOB.SEGMENT.ENTITY_CATEGORY_ID'],
			'order' => ['CREATED_AT' => 'ASC'],
			'limit' => 1,
		]);

		if ($collection->isEmpty())
		{
			return null;
		}

		$item = $collection->current();
		if ($item->getStatus() === Status::Progress->value)
		{
			if ($item->getUpdatedAt() <= (new DateTime())->add('-1 hours'))
			{
				$this->processErrorQueueItem(QueueItem::createFromEntity($item));

				return $this->getSuitableQueueItemEntity();
			}

			return null;
		}

		return $item;
	}

	private function getQueueItemExecutionResult(QueueItem $item, int $segmentId): Result
	{
		$context = (new Context())
			->setJobId($item->getJobId())
			->setSegmentId($segmentId)
		;

		$handler = Factory::getInstance()->getHandler(
			$item->getHandlerType(),
			$item->getParams()['segmentCode'] ?? null,
			$context
		);

		if ($handler === null)
		{
			return (new Result())->addError(new Error('Unknown handler type id: ' . $item->getHandlerTypeId()));
		}

		// @todo for ConfigurableHandler will be set segmentId

		try
		{
			$limit = $this->getLimit($item->isOnlyCalc());
			$result = $handler
				->setEntityTypeId($item->getLastEntityTypeId() ?? \CCrmOwnerType::Contact)
				->setLastEntityId($item->getLastItemId())
				->setLastAssignmentId($item->getLastAssignmentId())
				->setLimit($limit)
				->setIsOnlyCalc($item->isOnlyCalc())
				->execute()
			;
		}
		catch (\Exception $e)
		{
			return (new Result())->addError(new Error('Failed to execute queue item: ' . $e->getMessage()));
		}

		return $result;
	}

	private function getLimit(bool $isOnlyCalc): int
	{
		if ($isOnlyCalc)
		{
			return \COption::GetOptionInt('crm', 'repeat_sale_limit_items_executor_calc', self::ENTITY_ITEMS_ONLY_CALC_LIMIT);
		}

		return \COption::GetOptionInt('crm', 'repeat_sale_limit_items_executor', self::ENTITY_ITEMS_LIMIT);
	}

	private function processErrorQueueItem(QueueItem $item): void
	{
		$this->deleteFromQueue($item);

		if ($item->getRetryCount() > self::MAX_RETRY_COUNT)
		{
			return;
		}

		$item
			->setStatus(Status::Waiting)
			->incRetryCount()
		;

		$this->addToQueue($item);
	}

	private function markQueueItemAsProgress(QueueItem $item): void
	{
		$item->setStatus(Status::Progress);

		$this->getController()->update($item->getId(), $item);
	}

	private function isQueueItemCompleted(Result $result): bool
	{
		return (
			$result->isFinalQueueIteration()
			&& $result->getSegmentData()?->getEntityTypeId() === \CCrmOwnerType::Company
		);
	}

	private function onQueueItemCompleted(QueueItem $queueItem, Result $result): void
	{
		$itemsCount = $queueItem->getItemsCount() + count($result->getSegmentData()->getItems());

		$jobId = $queueItem->getJobId();
		$job = RepeatSaleJobController::getInstance()->getById($jobId);

		RepeatSaleSegmentController::getInstance()->updateClientCoverage($job?->getSegmentId(), $itemsCount);

		if ($itemsCount > 0 && $this->getAvailabilityChecker()->isSegmentsInitializationProgress())
		{
			$this->updateFlowToPending();
		}
	}

	private function updateFlowToPending(): void
	{
		(new SegmentManager())->updateFlowToPending();
	}

	private function deleteFromQueue(QueueItem $item): void
	{
		$this->getController()->delete($item->getId());
	}

	private function addToQueue(QueueItem $item): void
	{
		$this->getController()->add($item);
	}

	private function updateQueueItemForNextIteration(QueueItem $item, Result $result): void
	{
		$item
			->setStatus(Status::Waiting)
			->setLastAssignmentId($result->getSegmentData()?->getLastAssignmentId())
		;

		if ($result->isFinalQueueIteration())
		{
			$item
				->setLastItemId(null)
				->setLastEntityTypeId(\CCrmOwnerType::Company)
			;
		}
		else
		{
			$item
				->setLastEntityTypeId($result->getSegmentData()?->getEntityTypeId())
				->setLastItemId($result->getSegmentData()?->getLastEntityId())
			;
		}

		$item->setItemsCount($this->getItemsCount($item, $result));

		$this->getController()->update($item->getId(), $item);
	}

	private function getItemsCount(QueueItem $item, Result $result): int
	{
		return $item->getItemsCount() + count($result->getSegmentData()->getItems());
	}
}

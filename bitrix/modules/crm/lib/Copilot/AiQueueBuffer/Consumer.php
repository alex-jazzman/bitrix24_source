<?php

namespace Bitrix\Crm\Copilot\AiQueueBuffer;

use Bitrix\Crm\Copilot\AiQueueBuffer\Controller\AiQueueBufferController;
use Bitrix\Crm\Copilot\AiQueueBuffer\Entity\AiQueueBuffer;
use Bitrix\Crm\Copilot\AiQueueBuffer\Entity\AiQueueBufferItem;
use Bitrix\Crm\Copilot\AiQueueBuffer\Enum\Status;
use Bitrix\Crm\Copilot\AiQueueBuffer\Provider\Factory;
use Bitrix\Crm\Integration\AI\Model\QueueTable;
use Bitrix\Crm\Result;
use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Type\Date;
use Bitrix\Main\Web\Json;
use COption;

final class Consumer
{
	use Singleton;

	private const LIMIT = 5;
	private const MAX_AI_QUIRES_LIMIT_PER_DAY = 50;
	private const MAX_RETRY_COUNT = 5;
	private const MAX_PENDING_RECORDS = 20;

	private ?array $executionData = null;
	private ?AiQueueBufferController $controller = null;

	public function execute(): void
	{
		$this->init();

		if (!$this->canExecute())
		{
			return;
		}

		$items = $this->getItems();

		if ($items->isEmpty())
		{
			return;
		}

		$this->markItemsAsProgress($items);

		$result = $this->processItems($items);
		if ($result->isSuccess())
		{
			$this->incExecutionCount($result->getData()['successCount']);
		}
	}

	private function init(): void
	{
		$this->controller = AiQueueBufferController::getInstance();
	}

	private function canExecute(): bool
	{
		if ($this->isQueueHasManyPendingRecords())
		{
			return false;
		}

		$lastExecutionDate = $this->getLastExecutionDate();
		$today = new Date();

		if ($today > $lastExecutionDate)
		{
			$this->startNewDay();

			return true;
		}

		if ($this->getExecutionCount() >= $this->getMaxCountLimit())
		{
			return false;
		}

		return true;
	}

	private function isQueueHasManyPendingRecords(): bool
	{
		$count = (int)QueueTable::query()
			->where('EXECUTION_STATUS', QueueTable::EXECUTION_STATUS_PENDING)
			->queryCountTotal()
		;

		return $count >= self::MAX_PENDING_RECORDS;
	}

	private function getItems(): Entity\EO_AiQueueBuffer_Collection
	{
		return $this->controller->getList([
			'limit' => $this->getLimit(),
		]);
	}

	private function markItemsAsProgress(Entity\EO_AiQueueBuffer_Collection $items): void
	{
		/**
		 * @var $item AiQueueBuffer
		 */
		foreach ($items as $item)
		{
			if ($item->getStatus() !== Status::Progress->value)
			{
				$item->setStatus(Status::Progress->value);
			}
		}

		$items->save();
	}

	private function processItems(Entity\EO_AiQueueBuffer_Collection $items): Result
	{
		$successCount = 0;

		/**
		 * @var $item AiQueueBuffer
		 */
		foreach ($items as $item)
		{
			if ($item->getRetryCount() > self::MAX_RETRY_COUNT)
			{
				continue;
			}

			$provider = Factory::getProvider($item->getProviderId());
			if ($provider === null)
			{
				continue;
			}

			$result = $provider->process($item->getProviderData());
			if ($result->isSuccess())
			{
				$successCount++;
			}
			else
			{
				$this->moveItemToEndOfQueue($item);
			}
		}

		$this->controller->delete($items->getIdList());

		return (new Result())->setData(['successCount' => $successCount]);
	}

	private function moveItemToEndOfQueue(AiQueueBuffer $item): void
	{
		$this->controller->delete([$item->getId()]);

		$AiQueueBufferItem = AiQueueBufferItem::createFromEntity($item);
		$AiQueueBufferItem->incrementRetryCount();

		$this->controller->add($AiQueueBufferItem);
	}

	private function getLimit(): int
	{
		return COption::GetOptionInt(
			'crm',
			'ai_queue_buffer_execute_limit',
			self::LIMIT
		);
	}

	private function getMaxCountLimit(): int
	{
		return COption::GetOptionInt(
			'crm',
			'ai_queue_buffer_max_queue_limit_per_day',
			self::MAX_AI_QUIRES_LIMIT_PER_DAY
		);
	}

	private function getLastExecutionDate(): Date
	{
		if (isset($this->getExecutionData()['lastExecutionTimestamp']))
		{
			return Date::createFromTimestamp($this->getExecutionData()['lastExecutionTimestamp']);
		}

		return new Date();
	}

	private function getExecutionCount(): int
	{
		return $this->getExecutionData()['count'] ?? 0;
	}

	private function startNewDay(): void
	{
		$this->setExecutionData([
			'count' => 0,
			'lastExecutionTimestamp' => (new Date())->getTimestamp(),
		]);
	}

	private function incExecutionCount(int $count): void
	{
		if ($count <= 0)
		{
			return;
		}

		$executionData = $this->getExecutionData();
		$executionData['count'] = $count + ($executionData['count'] ?? 0);

		$this->setExecutionData($executionData);
	}

	private function getExecutionData(): array
	{
		$dataString = COption::GetOptionString(
			'crm',
			'ai_queue_buffer_execution_data',
			null
		);

		return ($dataString ? Json::decode($dataString) : []);
	}

	private function setExecutionData(array $executionData): void
	{
		COption::SetOptionString(
			'crm',
			'ai_queue_buffer_execution_data',
			Json::encode($executionData)
		);
	}
}

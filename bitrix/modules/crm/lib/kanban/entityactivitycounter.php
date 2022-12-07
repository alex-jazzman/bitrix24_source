<?php


namespace Bitrix\Crm\Kanban;


use Bitrix\Crm\Activity\Entity\IncomingChannelTable;
use Bitrix\Crm\ActivityBindingTable;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;

class EntityActivityCounter
{
	private int $entityTypeId;
	private array $entityIds;
	private array $deadlines;
	private array $incoming = [];
	private array $filter = [];
	private array $counters = [];

	public function __construct(int $entityTypeId, array $entityIds, array $deadlines = [])
	{
		$this->entityTypeId = $entityTypeId;
		$this->entityIds = array_unique($entityIds);
		$this->deadlines = $deadlines;

		$this->prepare();
	}

	public function appendToEntityItems(&$items): void
	{
		$errors = $this->getDeadlines();

		if (\Bitrix\Main\Config\Option::get('crm', 'enable_entity_uncompleted_act', 'Y') === 'Y')
		{
			$incoming = $this->getIncoming();
		}
		else
		{
			$incoming = [];
		}

		$activityCounters = $this->getCounters();

		foreach ($activityCounters as $id => $activityCounter)
		{
			if (!isset($items[$id]))
			{
				continue;
			}

			[
				$items[$id]['activityProgress'],
				$items[$id]['activityTotal']
			] = $this->getCounterValuesFromActivities($activityCounter);

			$items[$id]['activitiesByUser'] = $this->getPreparedActivitiesByUser($activityCounters[$id] ?? []);

			$activityCounterTotal = [];
			if (isset($errors[$id]))
			{
				$activityCounterTotal = $errors[$id];
				$items[$id]['activityErrorTotal'] = count($errors[$id]);
			}
			if (isset($incoming[$id]))
			{
				$activityCounterTotal = array_unique(array_merge($activityCounterTotal, $incoming[$id]));
				$items[$id]['activityIncomingTotal'] = count($incoming[$id]);
			}
			$items[$id]['activityCounterTotal'] = count($activityCounterTotal);
		}
	}

	private function prepare(): self
	{
		$this->prepareFilter();
		$this->prepareCounters();

		return $this;
	}

	private function prepareFilter(): void
	{
		$filter = [
			'BINDINGS' => [],
		];

		foreach ($this->entityIds as $id)
		{
			$filter['BINDINGS'][] = [
				'OWNER_ID' => $id,
				'OWNER_TYPE_ID' => $this->entityTypeId,
			];
		}

		$this->filter = $filter;
	}

	private function prepareCounters(): void
	{
		if (empty($this->entityIds))
		{
			return;
		}

		$this->prepareDeadlines();
		$this->prepareIncomings();

		$this->prepareActivitiesCounters();
		$this->preparePseudoActivitiesCounters();
	}

	private function prepareDeadlines(): void
	{
		$filter = $this->getDeadlinesFilter();

		$activities = \CCrmActivity::GetList(
			[],
			$filter,
			false, false,
			[
				'ID',
				'OWNER_ID',
			]
		);

		$fetched = [];
		while ($activity = $activities->fetch())
		{
			$activityId = $activity['ID'];
			if (!isset($fetched[$activityId]))
			{
				$fetched[$activityId] = true;
				$ownerId = $activity['OWNER_ID'];
				if (!isset($this->deadlines[$ownerId]))
				{
					$this->deadlines[$ownerId] = [];
				}
				$this->deadlines[$ownerId][] = (int)$activity['ID'];
			}
		}
	}

	private function getDeadlinesFilter(): array
	{
		$date = (new \Bitrix\Main\Type\DateTime())
			->toUserTime()
			->add('-'.date('G').' hours')
			->add('-'.date('i').' minutes')
			->add('+1 day')
		;//@ #81166

		return array_merge($this->filter, [
			'<=DEADLINE' => $date,
			'=COMPLETED' => 'N',
		]);
	}

	private function prepareIncomings(): void
	{
		$incomingList = IncomingChannelTable::getList([
			 'select' => [
				 'ACTIVITY_ID',
				 'OWNER_ID' => 'BINDING.OWNER_ID',
			 ],
			'filter' => [
				'BINDING.OWNER_TYPE_ID' => $this->entityTypeId,
				'@BINDING.OWNER_ID' => $this->entityIds,
				'COMPLETED' => 'N',
			],
			'runtime' => [
				new ReferenceField(
					'BINDING',
					ActivityBindingTable::class,
					Join::on('this.ACTIVITY_ID', 'ref.ACTIVITY_ID'),
					['join_type' => 'INNER']
				)
			]
		]);

		$fetched = [];
		while ($incoming = $incomingList->fetch())
		{
			$activityId = $incoming['ACTIVITY_ID'];
			if (!isset($fetched[$activityId]))
			{
				$fetched[$activityId] = true;
				$ownerId = $incoming['OWNER_ID'];
				if (!isset($this->incoming[$ownerId]))
				{
					$this->incoming[$ownerId] = [];
				}
				$this->incoming[$ownerId][] = (int)$incoming['ACTIVITY_ID'];
			}
		}
	}

	private function prepareActivitiesCounters(): void
	{
		$activities = \CCrmActivity::GetList(
			[],
			$this->filter,
			false,
			false,
			[
				'ID',
				'COMPLETED',
				'OWNER_ID',
				'RESPONSIBLE_ID',
			]
		);

		$multiBindings = $this->getMultiBindings();
		while ($activity = $activities->fetch())
		{
			$ownerId = $activity['OWNER_ID'];
			$isCompleted = $activity['COMPLETED'];
			$responsibleId = $activity['RESPONSIBLE_ID'];

			$this->prepareCounter($ownerId, $isCompleted, $responsibleId);

			$activityId = $activity['ID'];
			if (isset($multiBindings[$activityId]))
			{
				foreach ($multiBindings[$activityId] as $ownerId)
				{
					$this->prepareCounter($ownerId, $isCompleted, $responsibleId);
				}
			}
		}
	}

	private function prepareCounter(int $ownerId, string $isCompleted, int $responsibleId)
	{
		if (!isset($this->counters[$ownerId]))
		{
			$this->counters[$ownerId] = [];
		}

		if (!isset($this->counters[$ownerId][$isCompleted]))
		{
			$this->counters[$ownerId][$isCompleted] = 0;
		}

		$this->counters[$ownerId][$isCompleted]++;
		$this->counters[$ownerId]['byUser'][$responsibleId][$isCompleted]++;
	}

	private function getMultiBindings(): array
	{
		$activityBindings = \Bitrix\Crm\ActivityBindingTable::getList([
			'select' => [
				'ACTIVITY_ID',
				'OWNER_ID',
			],
			'filter' => [
				'OWNER_ID' => $this->entityIds,
				'OWNER_TYPE_ID' => $this->entityTypeId,
			],
		]);

		$bindings = [];
		while ($activityBinding = $activityBindings->fetch())
		{
			$activityId = $activityBinding['ACTIVITY_ID'];
			if (!isset($bindings[$activityId]))
			{
				$bindings[$activityId] = [];
			}
			$bindings[$activityId][] = $activityBinding['OWNER_ID'];
		}

		return $bindings;
	}

	private function preparePseudoActivitiesCounters(): void
	{
		$waits = \Bitrix\Crm\Pseudoactivity\WaitEntry::getRecentIDsByOwner($this->entityTypeId, $this->entityIds);
		if ($waits)
		{
			foreach ($waits as $row)
			{
				$entityId = $row['OWNER_ID'];
				if (!isset($this->counters[$entityId]['N']))
				{
					$this->counters[$entityId]['N'] = 0;
				}
				$this->counters[$entityId]['N']++;
			}
		}
	}

	public function getDeadlines(): array
	{
		return $this->deadlines;
	}

	public function getDeadlinesCount(int $entityId): int
	{
		return is_array($this->deadlines[$entityId]) ? count($this->deadlines[$entityId]) : 0;
	}

	public function getIncomingCount(int $entityId): int
	{
		return is_array($this->incoming[$entityId]) ? count($this->incoming[$entityId]) : 0;
	}

	public function getIncoming(): array
	{
		return $this->incoming;
	}

	public function getCounters(): array
	{
		return $this->counters;
	}

	private function getPreparedActivitiesByUser(array $activityCounters): array
	{
		if (!isset($activityCounters['byUser']))
		{
			return [];
		}

		$preparedActivities = [];

		foreach ($activityCounters['byUser'] as $userId => $activities)
		{
			[
				$preparedActivities[$userId]['activityProgress'],
				$preparedActivities[$userId]['activityTotal']
			] = $this->getCounterValuesFromActivities($activities);
		}

		return $preparedActivities;
	}

	private function getCounterValuesFromActivities(array $activities): array
	{
		return [
			$activities['N'] ?? 0,
			$activities['Y'] ?? 0,
		];
	}
}

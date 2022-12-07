<?php

namespace Bitrix\Crm\Counter\Monitor;

use Bitrix\Crm\Counter\EntityCounterType;
use Bitrix\Crm\ItemIdentifier;
use Bitrix\Main\Type\DateTime;

class ActivityChange
{
	private int $id;
	private bool $oldIsIncomingChannel;
	private bool $newIsIncomingChannel;
	private ?DateTime $oldDeadline;
	private ?DateTime $newDeadline;
	private bool $oldIsCompleted;
	private bool $newIsCompleted;
	private array $oldBindings;
	private array $newBindings;

	public static function create(int $id, array $oldFields, array $oldBindings, array $newFields, array $newBindings): self
	{
		$oldDeadline = ($oldFields['DEADLINE'] && !\CCrmDateTimeHelper::IsMaxDatabaseDate($oldFields['DEADLINE']))
			? DateTime::createFromUserTime($oldFields['DEADLINE'])
			: null
		;
		$newDeadline = ($newFields['DEADLINE'] && !\CCrmDateTimeHelper::IsMaxDatabaseDate($newFields['DEADLINE']))
			? DateTime::createFromUserTime($newFields['DEADLINE'])
			: null
		;

		$change = new self(
			$id,
			($oldFields['IS_INCOMING_CHANNEL'] ?? 'N') === 'Y',
			($newFields['IS_INCOMING_CHANNEL'] ?? 'N') === 'Y',
			$oldDeadline,
			$newDeadline,
			($oldFields['COMPLETED'] ?? 'N') === 'Y',
			($newFields['COMPLETED'] ?? 'N') === 'Y',
			self::prepareBindings($oldBindings),
			self::prepareBindings($newBindings)
		);

		return $change;
	}

	/**
	 * @return ItemIdentifier[]
	 */
	public static function prepareBindings(array $bindings): array
	{
		$result = [];
		foreach ($bindings as $binding)
		{
			$ownerTypeId = (int)$binding['OWNER_TYPE_ID'];
			$ownerId = (int)$binding['OWNER_ID'];
			if (\CCrmOwnerType::IsDefined($ownerTypeId) && $ownerId > 0)
			{
				$result[] = new ItemIdentifier($ownerTypeId, $ownerId);
			}
		}

		return $result;
	}

	public function __construct(
		int $id,
		bool $oldIsIncomingChannel,
		bool $newIsIncomingChannel,
		?DateTime $oldDeadline,
		?DateTime $newDeadline,
		bool $oldIsCompleted,
		bool $newIsCompleted,
		array $oldBindings,
		array $newBindings
	)
	{
		$this->id = $id;
		$this->oldIsIncomingChannel = $oldIsIncomingChannel;
		$this->newIsIncomingChannel = $newIsIncomingChannel;
		$this->oldDeadline = $oldDeadline;
		$this->newDeadline = $newDeadline;
		$this->oldIsCompleted = $oldIsCompleted;
		$this->newIsCompleted = $newIsCompleted;
		$this->oldBindings = $oldBindings;
		$this->newBindings = $newBindings;
	}

	public function applyNewChange(self $activityChange): void
	{
		$this->newIsIncomingChannel = $activityChange->getNewIsIncomingChannel();
		$this->newDeadline = $activityChange->getNewDeadline();
		$this->newIsCompleted = $activityChange->getNewIsCompleted();
		$this->newBindings = $activityChange->getNewBindings();
	}

	public function getId(): int
	{
		return $this->id;
	}

	public function getOldIsIncomingChannel(): bool
	{
		return $this->oldIsIncomingChannel;
	}

	public function getNewIsIncomingChannel(): bool
	{
		return $this->newIsIncomingChannel;
	}

	public function isIncomingChannelChanged(): bool
	{
		return ($this->oldIsIncomingChannel !== $this->newIsIncomingChannel);
	}

	public function getOldDeadline(): ?DateTime
	{
		return $this->oldDeadline;
	}

	public function getNewDeadline(): ?DateTime
	{
		return $this->newDeadline;
	}

	public function isDeadlineChanged(): bool
	{
		if ($this->oldDeadline && $this->newDeadline)
		{
			return $this->oldDeadline->getTimestamp() !== $this->newDeadline->getTimestamp();
		}
		if (!$this->oldDeadline && !$this->newDeadline)
		{
			return false;
		}

		return true;
	}

	public function getOldIsCompleted(): bool
	{
		return $this->oldIsCompleted;
	}

	public function getNewIsCompleted(): bool
	{
		return $this->newIsCompleted;
	}

	public function isCompletedChanged(): bool
	{
		return ($this->oldIsCompleted !== $this->newIsCompleted);
	}

	/**
	 * @return ItemIdentifier[]
	 */
	public function getOldBindings(): array
	{
		return $this->oldBindings;
	}

	/**
	 * @return ItemIdentifier[]
	 */
	public function getNewBindings(): array
	{
		return $this->newBindings;
	}

	public function getAffectedBindings(): array
	{
		$result = [];
		foreach ($this->getOldBindings() as $binding)
		{
			$result[$binding->getHash()] = $binding;
		}
		foreach ($this->getNewBindings() as $binding)
		{
			$result[$binding->getHash()] = $binding;
		}

		return array_values($result);
	}

	public function getAffectedCounterTypes(): array
	{
		$isIncomingChannelChanged = $this->isIncomingChannelChanged();
		$isDeadlineChanged = $this->isDeadlineChanged();
		$affectedTypeIds = [];
		if (($isDeadlineChanged && $isIncomingChannelChanged) || $this->isCompletedChanged())
		{
			$affectedTypeIds = EntityCounterType::getAll(true);
		}
		elseif ($isDeadlineChanged)
		{
			$affectedTypeIds = EntityCounterType::getAllDeadlineBased(true);
		}
		elseif ($isIncomingChannelChanged)
		{
			$affectedTypeIds = EntityCounterType::getAllIncomingBased(true);
		}

		return $affectedTypeIds;
	}
}

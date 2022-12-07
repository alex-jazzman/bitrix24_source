<?php

namespace Bitrix\Crm\Counter;

use Bitrix\Crm\Activity\Entity\EntityUncompletedActivityTable;
use Bitrix\Crm\Item;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Config\Option;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\ReferenceField;

abstract class QueryBuilder
{
	public const SELECT_TYPE_QUANTITY = 'QTY';
	public const SELECT_TYPE_ENTITIES = 'ENTY';

	protected int $entityTypeId;
	/**
	 * @var int[]
	 */
	protected array $userIds;
	protected string $selectType = self::SELECT_TYPE_QUANTITY;
	protected bool $useDistinct = true;
	protected bool $needExcludeUsers = false;
	protected bool $useUncompletedActivityTable = false;

	public function __construct(int $entityTypeId, array $userIds = [])
	{
		$this->entityTypeId = $entityTypeId;
		$this->userIds = array_values(array_unique(array_map('intval', $userIds)));
	}

	public function getSelectType(): string
	{
		return $this->selectType;
	}

	public function setSelectType(string $selectType): self
	{
		$this->selectType = $selectType;

		return $this;
	}

	public function isUseDistinct(): bool
	{
		return $this->useDistinct;
	}

	public function setUseDistinct(bool $useDistinct): self
	{
		$this->useDistinct = $useDistinct;

		return $this;
	}

	public function useUncompletedActivityTable(): bool
	{
		return $this->useUncompletedActivityTable;
	}

	public function setUseUncompletedActivityTable(bool $useUncompletedActivityTable): self
	{
		$this->useUncompletedActivityTable = $useUncompletedActivityTable;

		return $this;
	}

	public function needExcludeUsers(): bool
	{
		return $this->needExcludeUsers;
	}

	public function setExcludeUsers(bool $needExcludeUsers): self
	{
		$this->needExcludeUsers = $needExcludeUsers;

		return $this;
	}

	protected function applyResponsibleFilter(\Bitrix\Main\ORM\Query\Query $query, string $responsibleFieldName)
	{
		if (!empty($this->userIds))
		{
			if ($this->needExcludeUsers())
			{
				if (count($this->userIds) > 1)
				{
					$query->whereNotIn($responsibleFieldName, $this->userIds);
				}
				else
				{
					$query->whereNot($responsibleFieldName, $this->userIds[0]);
				}
			}
			else
			{
				if (count($this->userIds) > 1)
				{
					$query->whereIn($responsibleFieldName, $this->userIds);
				}
				else
				{
					$query->where($responsibleFieldName, $this->userIds[0]);
				}
			}
		}
	}

	/**
	 * Compatibility mode used while \Bitrix\Crm\Activity\Entity\EntityUncompletedActivityTable is not completely filled with data
	 * @return bool
	 */
	protected function isCompatibilityMode(): bool
	{
		return Option::get('crm', 'enable_entity_uncompleted_act', 'Y') !== 'Y';
	}

	public function build(\Bitrix\Main\ORM\Query\Query $query): \Bitrix\Main\ORM\Query\Query
	{
		if ($this->isCompatibilityMode() || !$this->useUncompletedActivityTable())
		{
			return $this->buildCompatible($query);
		}
		$referenceFilter = [
			'=ref.ENTITY_ID' => 'this.ID',
			'=ref.ENTITY_TYPE_ID' => new SqlExpression($this->entityTypeId),
		];

		$this->applyReferenceFilter($referenceFilter);

		$query->registerRuntimeField(
			'',
			new ReferenceField('B',
				EntityUncompletedActivityTable::getEntity(),
				$referenceFilter,
				['join_type' => $this->getJoinType()]
			)
		);

		$this->applyResponsibleFilter($query, $this->getEntityAssignedColumnName());
		$this->applyCounterTypeFilter($query);

		if ($this->getSelectType() === self::SELECT_TYPE_ENTITIES)
		{
			$query->addSelect('ID', 'ENTY');
		}
		else
		{
			$query->registerRuntimeField('', new ExpressionField('QTY', 'COUNT(%s)', 'ID'));
			$query->addSelect('QTY');
		}

		return $query;
	}

	protected function getJoinType(): string
	{
		return \Bitrix\Main\ORM\Query\Join::TYPE_INNER;
	}

	protected function applyReferenceFilter(array &$referenceFilter): void
	{
	}

	protected function applyCounterTypeFilter(\Bitrix\Main\ORM\Query\Query $query): void
	{
	}

	abstract protected function buildCompatible(\Bitrix\Main\ORM\Query\Query $query): \Bitrix\Main\ORM\Query\Query;

	protected function getEntityAssignedColumnName(): string
	{
		$factory = Container::getInstance()->getFactory($this->entityTypeId);
		if (!$factory)
		{
			return Item::FIELD_NAME_ASSIGNED;
		}

		return $factory->getEntityFieldNameByMap(Item::FIELD_NAME_ASSIGNED);
	}

	protected function getQuantityExpression(): ExpressionField
	{
		if ($this->isUseDistinct())
		{
			return new ExpressionField('QTY', 'COUNT(DISTINCT %s)', 'ID');
		}

		return new ExpressionField('QTY', 'COUNT(%s)', 'ID');
	}
}

<?php

namespace Bitrix\Crm\Kanban;

use Bitrix\Crm\Badge\Model\BadgeTable;
use Bitrix\Crm\Badge\SourceIdentifier;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Settings\Crm;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\ORM\Query\Result;

class EntityBadge
{
	private int $entityTypeId;
	private array $entityIds;

	public function __construct(int $entityTypeId, array $entityIds)
	{
		$this->entityTypeId = $entityTypeId;
		$this->entityIds = array_unique($entityIds);
	}

	public function appendToEntityItems(&$items): void
	{
		if (!Crm::isUniversalActivityScenarioEnabled())
		{
			return;
		}

		$badges = $this->getBadges();

		foreach ($badges as $badgeParams)
		{
			$id = $badgeParams['ENTITY_ID'];
			if (!isset($items[$id]))
			{
				continue;
			}

			$badge = Container::getInstance()->getBadge($badgeParams['TYPE'], $badgeParams['VALUE']);
			$items[$id]['badges'][] = $badge->getConfigFromMap();
		}
	}

	private function getBadges(): Result
	{
		$hiddenBadgesFilter = [
			'LOGIC' => 'OR',
			[
				'=SOURCE_PROVIDER_ID' => SourceIdentifier::CRM_OWNER_TYPE_PROVIDER,
				'!@SOURCE_ENTITY_TYPE_ID' => \CCrmOwnerType::getAllSuspended(),
			],
			'!=SOURCE_PROVIDER_ID' => SourceIdentifier::CRM_OWNER_TYPE_PROVIDER,
		];

		return BadgeTable::getList([
			'select' => [
				'ENTITY_ID',
				'MAX_DATE',
				'TYPE',
				'VALUE',
			],
			'filter' => [
				'=ENTITY_TYPE_ID' => $this->entityTypeId,
				'@ENTITY_ID' => $this->entityIds,
				$hiddenBadgesFilter,
			],
			'group' => [
				'TYPE',
				'ENTITY_ID',
			],
			'runtime' => [
				new ExpressionField('MAX_DATE', 'MAX(%s)', ['CREATED_DATE']),
			],
		]);
	}
}

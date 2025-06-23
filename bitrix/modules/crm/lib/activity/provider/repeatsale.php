<?php

namespace Bitrix\Crm\Activity\Provider;

use Bitrix\Crm\Integration\AI\EventHandler;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;
use CCrmActivityDirection;

final class RepeatSale extends Base
{
	public const PROVIDER_ID = 'CRM_REPEAT_SALE';
	public const PROVIDER_TYPE_ID_DEFAULT = 'REPEAT_SALE';
	
	public static function getId(): string
	{
		return self::PROVIDER_ID;
	}
	
	public static function getTypeId(array $activity): string
	{
		return $activity['PROVIDER_TYPE_ID'] ?? self::PROVIDER_TYPE_ID_DEFAULT;
	}
	
	public static function getName(): string
	{
		return Loc::getMessage('CRM_ACTIVITY_PROVIDER_REPEAT_SALE_NAME') ?? '';
	}
	
	public static function isActive(): bool
	{
		return Container::getInstance()->getRepeatSaleAvailabilityChecker()->isAvailable();
	}
	
	public static function hasPlanner(array $activity): bool
	{
		return false;
	}

	public static function isTypeEditable($providerTypeId = null, $direction = CCrmActivityDirection::Undefined): bool
	{
		return false;
	}

	public static function getTypesFilterPresets()
	{
		return array(
			array(
				'NAME' => Loc::getMessage('CRM_ACTIVITY_PROVIDER_REPEAT_SALE_NAME'),
			),
		);
	}
	
	public static function getTypes(): array
	{
		return [
			[
				'NAME' => self::getName(),
				'PROVIDER_ID' => self::getId(),
				'PROVIDER_TYPE_ID' => self::PROVIDER_TYPE_ID_DEFAULT
			]
		];
	}
	
	// @todo: fixme
	public static function checkFields($action, &$fields, $id, $params = null)
	{
		if (isset($fields['END_TIME']) && $fields['END_TIME'] != '')
		{
			$fields['DEADLINE'] = $fields['END_TIME'];
		}
		
		return new Result();
	}
	
	public static function onAfterAdd($activityFields, array $params = null)
	{
		EventHandler::onAfterRepeatSaleActivityAdd($activityFields);
	}
}

<?php

namespace Bitrix\CrmMobile\Entity;

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Factory;
use Bitrix\Crm\Settings\LeadSettings;
use Bitrix\Main\Loader;

final class FactoryProvider
{
	/**
	 * @return Factory[]
	 */
	public static function getAvailableFactories(): array
	{
		if (!Loader::includeModule('crm'))
		{
			return [];
		}

		$factories = Container::getInstance()->getTypesMap()->getFactories();

		$factories = static::filterSupportedFactories($factories);
		$factories = static::filterPermittedFactories($factories);

		return $factories;
	}

	public static function getSupportedEntityNames(): array
	{
		$entities = [];

		if (LeadSettings::isEnabled())
		{
			$entities[] = \CCrmOwnerType::LeadName;
		}

		return array_merge(
			$entities,
			[
				\CCrmOwnerType::DealName,
				\CCrmOwnerType::ContactName,
				\CCrmOwnerType::CompanyName,
			]
		);
	}

	private static function filterSupportedFactories(array $factories): array
	{
		$factoryMap = [];
		foreach ($factories as $factory)
		{
			$factoryMap[$factory->getEntityName()] = $factory;
		}

		$result = [];

		foreach (static::getSupportedEntityNames() as $entityName)
		{
			$factory = $factoryMap[$entityName] ?? null;
			if ($factory)
			{
				$result[] = $factory;
			}
		}

		return $result;
	}

	private static function filterPermittedFactories(array $factories): array
	{
		$result = [];
		$userPermissions = Container::getInstance()->getUserPermissions();

		foreach ($factories as $factory)
		{
			if ($userPermissions->checkReadPermissions($factory->getEntityTypeId()))
			{
				$result[] = $factory;
			}
		}

		return $result;
	}
}

<?php

namespace Bitrix\Crm\Terminal;

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Application;

final class AvailabilityManager
{
	/** @var AvailabilityManager|null */
	private static $instance = null;

	public function isAvailable(): bool
	{
		return (
			in_array(
				Application::getInstance()->getLicense()->getRegion(),
				[
					'ru',
					'br',
					'in',
				],
				true
			)
			&&  Container::getInstance()
				->getUserPermissions()
				->entityType()
				->canReadItems(\CCrmOwnerType::OrderPayment)
		);
	}

	/**
	 * @return AvailabilityManager
	 */
	public static function getInstance()
	{
		if(self::$instance === null)
		{
			self::$instance = new AvailabilityManager();
		}

		return self::$instance;
	}

	private function __construct()
	{
	}

	private function __clone()
	{
	}
}

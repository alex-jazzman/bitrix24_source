<?php

declare(strict_types=1);

namespace Bitrix\Booking\Internals\Integration\Crm;

use Bitrix\Crm\Service\WebForm\Scenario\BaseScenario;
use Bitrix\Crm\WebForm\Preset;
use Bitrix\Main\Loader;

class WebForm
{
	public static function getCrmFormLink(): string
	{
		if (!self::isAvailable())
		{
			return '';
		}

		return '/crm/webform/?IS_BOOKING_FORM=Y&apply_filter=Y';
	}

	public static function getPresetLink(array $preset): string
	{
		if (!self::isAvailable())
		{
			return '';
		}

		return '/crm/webform/edit/0/?SCENARIO_ID=' . $preset['XML_ID'];
	}

	public static function getCrmFormPresets(): array
	{
		if (!self::isAvailable())
		{
			return [];
		}

		$result = [];

		$presets = Preset::getByIds([
			BaseScenario::SCENARIO_BOOKING_AUTO_SELECTION,
			BaseScenario::SCENARIO_BOOKING_ANY_RESOURCE,
			BaseScenario::SCENARIO_BOOKING_MANUAL_SETTINGS,
		]);
		foreach ($presets as $preset)
		{
			$result[] = array_merge($preset, [
				'LINK' => self::getPresetLink($preset),
			]);
		}

		return $result;
	}

	public static function isAvailable(): bool
	{
		return Loader::includeModule('crm');
	}
}

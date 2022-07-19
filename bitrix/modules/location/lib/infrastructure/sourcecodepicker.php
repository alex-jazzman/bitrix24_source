<?php

namespace Bitrix\Location\Infrastructure;

use Bitrix\Location\Entity\Source\Factory;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

/**
 * Class SourceCodePicker
 * @package Bitrix\Location\Infrastructure
 * @internal
 */
final class SourceCodePicker
{
	/**
	 * @return string
	 */
	public static function getSourceCode(): string
	{
		$configuredSourceCode = static::getConfiguredSourceCode();

		if ($configuredSourceCode)
		{
			return $configuredSourceCode;
		}

		if (ModuleManager::isModuleInstalled('bitrix24') && Loader::includeModule('bitrix24'))
		{
			return Factory::OSM_SOURCE_CODE;
		}

		if (Option::get('location', 'use_google_api', 'Y') === 'Y')
		{
			return Factory::GOOGLE_SOURCE_CODE;
		}

		return '';
	}

	/**
	 * @return string
	 */
	private static function getConfiguredSourceCode(): string
	{
		if (defined('LOCATION_DEFAULT_SOURCE_CODE'))
		{
			return (string)LOCATION_DEFAULT_SOURCE_CODE;
		}

		return (string)Option::get('location', 'location_default_source_code', '');
	}
}

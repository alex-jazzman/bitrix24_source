<?php

use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\AI\Operation\Scenario;
use Bitrix\Crm\Integration\AI\Operation\TranscribeCallRecording;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$createTimeAliases = [];
$isAIEnabledInGlobalSettings = false;
$isAIHasPackages = false;
$allAIOperationTypes = [];
$transcribeAIOperationType = 0;

if (Loader::includeModule('crm'))
{
	$container = Container::getInstance();

	$map = $container->getTypesMap();
	foreach ($map->getFactories() as $factory)
	{
		$createTimeAliases[$factory->getEntityTypeId()] =
			$factory->getEntityFieldNameByMap(\Bitrix\Crm\Item::FIELD_NAME_CREATED_TIME)
		;
	}

	$isAIEnabledInGlobalSettings = AIManager::isEnabledInGlobalSettings();
	$isAIHasPackages = AIManager::isBaasServiceHasPackage();

	if ($isAIHasPackages && AIManager::isAiCallAutomaticProcessingAllowed())
	{
		$allAIOperationTypes = AIManager::getAllOperationTypes();
		$transcribeAIOperationType = TranscribeCallRecording::TYPE_ID;
	}
}

return [
	'css' => 'dist/settings-button-extender.bundle.css',
	'js' => 'dist/settings-button-extender.bundle.js',
	'rel' => [
		'main.core.events',
		'ui.entity-selector',
		'crm.activity.todo-notification-skip-menu',
		'crm.activity.todo-ping-settings-menu',
		'crm.kanban.restriction',
		'crm.kanban.sort',
		'main.core',
		'main.popup',
	],
	'skip_core' => false,
	'settings' => [
		'createTimeAliases' => $createTimeAliases,
		'isAIEnabledInGlobalSettings' => $isAIEnabledInGlobalSettings,
		'isAIHasPackages' => $isAIHasPackages,
		'allAIOperationTypes' => $allAIOperationTypes,
		'transcribeAIOperationType' => $transcribeAIOperationType,
		'aiDisabledSliderCode' => Scenario::FILL_FIELDS_SCENARIO_OFF_SLIDER_CODE,
		'aiPackagesEmptySliderCode' => AIManager::AI_PACKAGES_EMPTY_SLIDER_CODE,
	],
];

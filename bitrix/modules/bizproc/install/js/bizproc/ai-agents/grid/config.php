<?php

use Bitrix\Bizproc\Internal\Config\Storage;
use Bitrix\Bizproc\Internal\Service\Feature\AiAgentsFeature;
use Bitrix\Bizproc\Internal\Service\Tariff\TariffChecker;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isAiAgentsAvailable = false;
$aiAgentsTariffSliderCode = null;
$isBasicOrHigher = false;
$filterHintState = null;

if (Loader::includeModule('bizproc'))
{
	$aiAgentsFeature = new AiAgentsFeature();
	$isAiAgentsAvailable = $aiAgentsFeature->isAvailable();
	$aiAgentsTariffSliderCode = $aiAgentsFeature->getTariffSliderCode();
	$isBasicOrHigher = TariffChecker::isBasicOrHigher();
	$filterHintState = (new Storage())->getAiAgentsFilterHintState();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => 'dist/grid.bundle.js',
	'rel' => [
		'bizproc.setup-template',
		'humanresources.company-structure.public',
		'im.public',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'main.sidepanel',
		'ui.a11y',
		'ui.avatar',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.info-helper',
		'ui.notification',
		'ui.system.typography',
	],
	'skip_core' => false,
	'settings' => [
		'tariffInfo' => [
			'isAiAgentsAvailable' => $isAiAgentsAvailable,
			'aiAgentsTariffSliderCode' => $aiAgentsTariffSliderCode,
			'isBasicOrHigher' => $isBasicOrHigher,
		],
		'filterHintState' => $filterHintState,
	],
];

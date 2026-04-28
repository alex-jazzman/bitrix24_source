<?php

use Bitrix\Bizproc\Internal\Service\Feature\AiAgentsFeature;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isAiAgentsAvailable = false;
$aiAgentsTariffSliderCode = null;

if (Loader::includeModule('bizproc'))
{
	$aiAgentsFeature = new AiAgentsFeature();
	$isAiAgentsAvailable = $aiAgentsFeature->isAvailable();
	$aiAgentsTariffSliderCode = $aiAgentsFeature->getTariffSliderCode();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => 'dist/grid.bundle.js',
	'rel' => [
		'bizproc.ai-agents.grid',
		'main.popup',
		'main.sidepanel',
		'ui.entity-selector',
		'im.public',
		'humanresources.company-structure.public',
		'ui.avatar',
		'main.date',
		'ui.buttons',
		'ui.info-helper',
		'ui.system.typography',
		'main.core.events',
		'bizproc.setup-template',
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
	'settings' => [
		'tariffInfo' => [
			'isAiAgentsAvailable' => $isAiAgentsAvailable,
			'aiAgentsTariffSliderCode' => $aiAgentsTariffSliderCode,
		],
	],
];

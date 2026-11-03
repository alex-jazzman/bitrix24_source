<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Facade\Bitrix24;
use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$copilotName = (new CopilotNameService())->getCopilotName();
$scenarioDisableFeedback = [
	'enabled' => false,
	'idPrefix' => 'ai.scenario-disable-feedback',
	'forms' => [],
];

if (Loader::includeModule('ai') && Bitrix24::shouldUseB24())
{
	$scenarioDisableFeedback['enabled'] = true;
	$scenarioDisableFeedback['forms'] = [
		Bitrix24::isCisZone()
			? [
				'zones' => Bitrix24::CIS_ZONES,
				'id' => 3008,
				'lang' => 'ru',
				'sec' => 'nijlll',
			]
			: [
				'zones' => ['en'],
				'id' => 852,
				'lang' => 'en',
				'sec' => 'i2y8pt',
			],
	];
}

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'ai.ui.field.selectorfield',
		'main.core',
		'main.core.events',
		'ui.alerts',
		'ui.form-elements.field',
		'ui.form-elements.view',
		'ui.section',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
		'scenarioDisableFeedback' => $scenarioDisableFeedback,
	],
];

<?php

use Bitrix\Main\Loader;
use Bitrix\Timeman\V2\Public\Provider\SettingsProvider;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!CBXFeatures::IsFeatureEnabled('timeman')
	|| !\Bitrix\Main\Loader::includeModule('timeman')
	|| !CTimeMan::canUse()
)
{
	return [];
}

$startInfo = CTimeMan::getRuntimeInfo();

$startInfo['PLANNER'] = $startInfo['PLANNER']['DATA'];

$userReport = new CUserReportFull;

$settingsProvider = new SettingsProvider();
$hasAiReportAccess = false;
if (method_exists($settingsProvider, 'hasAiReportAccess'))
{
	$hasAiReportAccess = $settingsProvider->hasAiReportAccess();
}

$copilotName = 'BitrixGPT';
if (Loader::includeModule('ui'))
{
	$copilotName = (new CopilotNameService())->getCopilotName();
}

return [
	'css' => 'dist/work-status-control-panel.bundle.css',
	'js' => 'dist/work-status-control-panel.bundle.js',
	'rel' => [
		'ajax',
		'calendar_planner_handler',
		'CJSTask',
		'ls',
		'main.core',
		'main.core.events',
		'main.popup',
		'planner',
		'popup',
		'tasks_planner_handler',
		'timeman',
		'timeman.work-time-report',
		'timer',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'ui.system.menu.vue',
		'ui.system.skeleton.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
	'settings' => [
		'workReport' => $userReport->getReportData(),
		'info' => $startInfo,
		'siteId' => SITE_ID,
		'isReportsEnabled' => $settingsProvider->isReportsEnabledWithAi(),
		'hasAiReportAccess' => $hasAiReportAccess,
		'copilotName' => $copilotName,
	],
];

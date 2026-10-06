<?php

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Timeman\V2\Public\Provider\SettingsProvider;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isReportsEnabled = false;
$hasAiReportAccess = false;
$copilotName = 'BitrixGPT';

if (Loader::includeModule('timeman'))
{
	$settingsProvider = new SettingsProvider();
	$isReportsEnabled = $settingsProvider->isReportsEnabledWithAi();
	if (method_exists($settingsProvider, 'hasAiReportAccess'))
	{
		$hasAiReportAccess = $settingsProvider->hasAiReportAccess();
	}
}

if (Loader::includeModule('ui'))
{
	$copilotName = (new CopilotNameService())->getCopilotName();
}

return [
	'js' => 'dist/work-time-report.bundle.js',
	'css' => 'dist/work-time-report.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'pull.client',
		'timeman.provider.service.full-report-service',
		'timeman.provider.service.record-service',
		'timeman.provider.service.report-service',
		'ui.bbcode.formatter.html-formatter',
		'ui.icon-set.api.vue',
		'ui.icons.b24',
		'ui.text-editor',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
	'settings' => [
		'currentUserId' => (int)CurrentUser::get()->getId(),
		'isReportsEnabled' => $isReportsEnabled,
		'hasAiReportAccess' => $hasAiReportAccess,
		'copilotName' => $copilotName,
	],
];

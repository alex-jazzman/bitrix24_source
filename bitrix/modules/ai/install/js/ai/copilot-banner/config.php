<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Facade\Bitrix24;
use Bitrix\AI\Facade\Intranet;
use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$isWestZone = false;
if (Loader::includeModule('ai'))
{
	if (Loader::includeModule('bitrix24'))
	{
		$isWestZone = Bitrix24::isWestZone();
	}
	elseif (Loader::includeModule('intranet'))
	{
		$isWestZone = Intranet::isWestZone();
	}
}

$copilotName = (new CopilotNameService())->getCopilotName();


return [
	'css' => 'dist/copilot-banner.bundle.css',
	'js' => 'dist/copilot-banner.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.icon-set.api.core',
		'ui.hint',
		'main.core.events',
	],
	'skip_core' => false,
	'settings' => [
		'isWestZone' => $isWestZone,
		'copilotName' => $copilotName,
	]
];

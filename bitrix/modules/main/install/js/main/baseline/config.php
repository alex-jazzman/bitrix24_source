<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\Loader::includeModule('ui');

$hasCollectDataOption = Option::get('ui', 'ui_analytics_collect_data', 'N') === 'Y';
$helpCode = '27229654';

return [
	'js' => 'dist/baseline.bundle.js',
	'skip_core' => true,
	'settings' => [
		'collectData' => ModuleManager::isModuleInstalled('bitrix24') || $hasCollectDataOption,
		'helpUrl' => \Bitrix\UI\Util::getArticleUrlByCode($helpCode),
		'helpCode' => 'redirect=detail&code='.$helpCode,
	],
];

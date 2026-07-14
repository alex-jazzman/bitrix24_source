<?php

use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (ModuleManager::isModuleInstalled('rest'))
{
	CJSCore::init(['marketplace']);
}

return [
	'css' => 'dist/feature-menu.bundle.css',
	'js' => 'dist/feature-menu.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'marketplace',
		'ui.icon-set.api.core',
		'ui.popupcomponentsmaker',
		'ui.system.menu',
	],
	'skip_core' => false,
];

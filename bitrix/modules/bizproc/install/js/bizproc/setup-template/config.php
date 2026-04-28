<?php

use Bitrix\Bizproc\BaseType\Date;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/setup-template.bundle.css',
	'js' => 'dist/setup-template.bundle.js',
	'rel' => [
		'pull.client',
		'ui.vue3',
		'main.core.events',
		'bizproc.rag-selector',
		'ui.entity-selector',
		'ui.uploader.tile-widget',
		'ui.uploader.core',
		'main.core',
		'ui.date-picker',
		'ui.alerts',
		'ui.sidepanel-content',
		'ui.forms',
		'ui.layout-form',
	],
	'skip_core' => false,
	'settings' => [
		'timezones' => \Bitrix\Main\Loader::includeModule('bizproc') ? Date::getZones() : [],
	],
];

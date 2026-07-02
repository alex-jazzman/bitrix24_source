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
		'bizproc.rag-selector',
		'main.core',
		'main.core.events',
		'pull.client',
		'ui.alerts',
		'ui.date-picker',
		'ui.entity-selector',
		'ui.forms',
		'ui.layout-form',
		'ui.sidepanel-content',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => [
		'timezones' => \Bitrix\Main\Loader::includeModule('bizproc') ? Date::getZones() : [],
	],
];

<?php

use Bitrix\Bizproc\BaseType\Date;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('bizproc');

return [
	'js' => './dist/datetime.bundle.js',
	'css' => './dist/datetime.bundle.css',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'main.date',
		'ui.date-picker',
		'ui.design-tokens',
		'ui.icon-set.main',
		'ui.icon-set.outline',
	],
	'settings' => [
		'timezones' => Date::getZones(),
	],
	'skip_core' => false,
];

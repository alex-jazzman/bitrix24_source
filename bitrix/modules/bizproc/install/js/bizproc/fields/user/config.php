<?php

declare(strict_types=1);

use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/user.bundle.js',
	'css' => './dist/user.bundle.css',
	'rel' => [
		'bizproc.fields',
		'bp_user_selector',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.icon-set.outline',
	],
	'settings' => [
		'canUseHumanResources' => Loader::includeModule('humanresources'),
	],
	'skip_core' => false,
];

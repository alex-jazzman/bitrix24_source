<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Page\Asset;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('crm');

Asset::getInstance()->addJs('/bitrix/js/crm/activity.js');

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'crm_common',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.vue3',
	],
	'skip_core' => false,
];

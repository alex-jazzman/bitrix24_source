<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Sign\Config\Storage;

$languages = Loader::includeModule('sign') ? Storage::instance()->getLanguages() : [];

return [
	'css' => 'dist/placeholders.bundle.css',
	'js' => 'dist/placeholders.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'sign.v2.analytics',
		'sign.v2.api',
		'sign.v2.b2e.company-selector',
		'sign.v2.b2e.field-selector',
		'sign.v2.b2e.hcm-link-company-selector',
		'sign.v2.b2e.vue-util',
		'sign.v2.helper',
		'ui.a11y',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
	'settings' => [
		'languages' => $languages,
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
	],
];

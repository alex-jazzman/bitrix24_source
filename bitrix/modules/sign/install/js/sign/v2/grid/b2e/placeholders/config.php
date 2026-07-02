<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placeholders.bundle.css',
	'js' => 'dist/placeholders.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'sign.v2.api',
		'sign.v2.b2e.company-selector',
		'sign.v2.b2e.field-selector',
		'sign.v2.b2e.hcm-link-company-selector',
		'sign.v2.b2e.vue-util',
		'sign.v2.helper',
		'ui.buttons',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => [
		'languages' => \Bitrix\Sign\Config\Storage::instance()->getLanguages(),
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
	],
];

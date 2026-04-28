<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placeholders.bundle.css',
	'js' => 'dist/placeholders.bundle.js',
	'rel' => [
		'sign.v2.b2e.vue-util',
		'sign.v2.helper',
		'sign.v2.b2e.company-selector',
		'sign.v2.b2e.hcm-link-company-selector',
		'main.core',
		'ui.vue3',
		'sign.v2.api',
		'sign.v2.b2e.field-selector',
		'ui.buttons',
		'main.loader',
	],
	'skip_core' => false,
	'settings' => [
		'languages' => \Bitrix\Sign\Config\Storage::instance()->getLanguages(),
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
	],
];

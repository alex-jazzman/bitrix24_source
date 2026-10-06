<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sign-settings-templates.bundle.css',
	'js' => 'dist/sign-settings-templates.bundle.js',
	'rel' => [
		'humanresources.hcmlink.data-mapper',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.date',
		'main.sidepanel',
		'sign.v2.api',
		'sign.v2.b2e.document-template-filling',
		'sign.v2.b2e.document-template-send',
		'sign.v2.b2e.document-template-user-party',
		'sign.v2.b2e.hcm-link-employee-selector',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.vue3',
		'ui.vue3.pinia',
		'ui.wizard',
	],
	'skip_core' => false,
	'settings' => [
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
	],
];

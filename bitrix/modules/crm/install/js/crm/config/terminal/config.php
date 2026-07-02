<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}


return [
	'css' => [
		'dist/terminal.bundle.css',
		'/bitrix/components/bitrix/ui.button.panel/templates/.default/style.css',
	],
	'js' => 'dist/terminal.bundle.js',
	'rel' => [
		'bitrix24.phoneverify',
		'landing.backend',
		'landing.pageobject',
		'main.core',
		'main.popup',
		'rest.client',
		'ui.dialogs.messagebox',
		'ui.label',
		'ui.notification',
		'ui.switcher',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

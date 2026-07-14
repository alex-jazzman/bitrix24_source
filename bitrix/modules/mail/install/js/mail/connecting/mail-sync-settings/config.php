<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mail-sync-settings.bundle.css',
	'js' => 'dist/mail-sync-settings.bundle.js',
	'rel' => [
		'mail.setting-selector',
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
];

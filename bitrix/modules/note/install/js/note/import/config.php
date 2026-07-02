<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/import.bundle.js',
	'css' => 'dist/import.bundle.css',
	'rel' => [
		'main.core',
		'note.ui.loader',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.progressbar',
		'ui.system.checkbox',
		'ui.system.dialog',
		'ui.system.input.vue',
		'ui.system.menu',
		'ui.vue3',
	],
	'skip_core' => false,
];

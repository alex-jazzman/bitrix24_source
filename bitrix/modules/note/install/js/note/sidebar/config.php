<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/sidebar.bundle.js',
	'css' => 'dist/sidebar.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'note.import',
		'note.permissions',
		'note.ui.action-menu',
		'note.ui.loader',
		'note.ui.theme-context',
		'pull.client',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.dialog',
		'ui.vue3',
	],
	'skip_core' => false,
];

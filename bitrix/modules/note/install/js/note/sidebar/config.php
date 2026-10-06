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
		'note.analytics',
		'note.import',
		'note.permissions',
		'note.ui.action-menu',
		'note.ui.collection-picker',
		'note.ui.document-history',
		'note.ui.loader',
		'note.ui.theme-context',
		'pull.client',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.solid',
		'ui.notification',
		'ui.system.dialog',
		'ui.vue3',
	],
	'skip_core' => false,
];

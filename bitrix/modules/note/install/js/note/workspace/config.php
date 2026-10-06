<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/workspace.bundle.js',
	'css' => './dist/workspace.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'note.analytics',
		'note.editor',
		'note.permissions',
		'note.sidebar',
		'note.ui.action-menu',
		'note.ui.collection-picker',
		'note.ui.document-history',
		'note.ui.document-list',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.solid',
		'ui.notification',
		'ui.system.dialog',
		'ui.vue3',
	],
	'skip_core' => false,
];

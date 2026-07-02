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
		'note.permissions',
		'note.sidebar',
		'note.ui.action-menu',
		'note.ui.document-list',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.vue3',
	],
	'skip_core' => false,
];

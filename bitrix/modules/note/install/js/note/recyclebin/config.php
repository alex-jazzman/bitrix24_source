<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/recyclebin.bundle.js',
    'css' => './dist/recyclebin.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'note.sidebar',
		'note.ui.action-menu',
		'note.ui.collection-picker',
		'note.ui.document-list',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'ui.notification',
		'ui.system.dialog',
		'ui.vue3',
	],
    'skip_core' => false,
];

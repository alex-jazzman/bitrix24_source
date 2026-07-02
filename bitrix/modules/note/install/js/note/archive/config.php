<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/archive.bundle.js',
    'css' => './dist/archive.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'note.sidebar',
		'note.ui.action-menu',
		'note.ui.document-list',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.notification',
		'ui.system.dialog',
		'ui.vue3',
	],
    'skip_core' => false,
];

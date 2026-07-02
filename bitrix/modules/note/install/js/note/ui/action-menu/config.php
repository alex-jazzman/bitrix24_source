<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/action-menu.bundle.js',
	'css' => './dist/action-menu.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'note.ui.theme-context',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];

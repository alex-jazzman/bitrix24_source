<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/document-list.bundle.js',
	'css' => './dist/document-list.bundle.css',
	'rel' => [
		'main.core',
		'main.date',
		'main.polyfill.intersectionobserver',
		'note.ui.avatar-stack',
		'note.ui.loader',
		'note.ui.theme-context',
		'ui.hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.checkbox',
		'ui.vue3',
	],
	'skip_core' => false,
];

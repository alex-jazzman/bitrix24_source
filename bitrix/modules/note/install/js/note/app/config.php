<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/app.bundle.js',
	'css' => 'dist/app.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'note.analytics',
		'note.archive',
		'note.editor',
		'note.recyclebin',
		'note.search',
		'note.shared',
		'note.sidebar',
		'note.ui.assets',
		'note.ui.loader',
		'note.ui.rail-geometry',
		'note.ui.theme-context',
		'note.workspace',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.notification',
		'ui.system.dialog',
		'ui.vue3',
		'ui.vue3.router',
	],
	'skip_core' => false,
];

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/editor.bundle.js',
	'css' => 'dist/editor.bundle.css',
	'rel' => [
		'color_picker',
		'main.core',
		'main.core.events',
		'note.analytics',
		'note.permissions',
		'note.sidebar',
		'note.ui.action-menu',
		'note.ui.document-list',
		'note.ui.loader',
		'note.ui.mention-chip',
		'note.ui.theme-context',
		'pull.client',
		'translit',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.uploader.vue',
		'ui.viewer',
		'ui.vue3',
		'ui.vue3.bitrixvue',
	],
	'skip_core' => false,
];

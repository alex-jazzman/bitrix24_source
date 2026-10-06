<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/ui.uploader.tile-widget.bundle.js',
	'css' => 'dist/ui.uploader.tile-widget.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icons.generator',
		'ui.progressround',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.uploader.vue',
	],
	'skip_core' => false,
];

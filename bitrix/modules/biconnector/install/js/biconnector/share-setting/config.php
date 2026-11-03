<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/share-setting.bundle.css',
	'js' => 'dist/share-setting.bundle.js',
	'rel' => [
		'biconnector.share-ban-dialog',
		'main.core',
		'main.core.events',
		'main.date',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.switcher',
	],
	'skip_core' => false,
];

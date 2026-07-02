<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/blank-selector.bundle.css',
	'js' => 'dist/blank-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.document-block',
		'sign.v2.sign-settings',
		'ui.entity-selector',
		'ui.icons',
		'ui.notification',
		'ui.sidepanel.layout',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
	],
	'skip_core' => false,
];

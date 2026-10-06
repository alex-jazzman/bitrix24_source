<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/call-view.bundle.js',
	'css' => 'dist/call-view.bundle.css',
	'rel' => [
		'call.adapter.clipboard',
		'call.core',
		'call.feature.pip',
		'call.lib.analytics',
		'call.mapping',
		'im.v2.lib.desktop-api',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.switcher',
	],
	'skip_core' => false,
];

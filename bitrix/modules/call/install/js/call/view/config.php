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
		'call.lib.a11y',
		'call.lib.analytics',
		'call.lib.push-to-talk',
		'call.lib.view-contract',
		'call.mapping',
		'im.v2.lib.desktop-api',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.a11y',
		'ui.switcher',
		'ui.system.menu',
	],
	'skip_core' => false,
];

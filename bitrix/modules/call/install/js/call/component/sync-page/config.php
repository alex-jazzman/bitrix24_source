<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sync-page.bundle.css',
	'js' => 'dist/sync-page.bundle.js',
	'rel' => [
		'calendar.compacteventform-launcher',
		'calendar.sharing.interface',
		'call.adapter.clipboard',
		'call.adapter.logger',
		'call.core',
		'call.legacy.component.elements',
		'call.lib.analytics',
		'call.lib.call-manager',
		'call.lib.sync-tab-banner-launcher',
		'im.public',
		'main.core',
		'rest.client',
	],
	'skip_core' => false,
];

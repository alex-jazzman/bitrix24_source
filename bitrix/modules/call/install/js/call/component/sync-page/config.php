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
		'call.component.elements',
		'call.core',
		'call.lib.analytics',
		'call.lib.call-manager',
		'im.public',
		'main.core',
		'rest.client',
		'ui.banner-dispatcher',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];

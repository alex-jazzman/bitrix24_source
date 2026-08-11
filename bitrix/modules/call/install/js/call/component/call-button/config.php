<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-button.bundle.css',
	'js' => 'dist/call-button.bundle.js',
	'rel' => [
		'call.component.elements',
		'call.const',
		'call.core',
		'call.lib.analytics',
		'call.lib.call-manager',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.local-storage',
		'im.v2.lib.menu',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.rest',
		'main.core',
		'main.core.events',
		'ui.system.menu',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];

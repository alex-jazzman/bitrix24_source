<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-message.bundle.css',
	'js' => 'dist/call-message.bundle.js',
	'rel' => [
		'call.lib.analytics',
		'call.lib.call-manager',
		'im.public',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.const',
		'im.v2.lib.date-formatter',
		'main.core',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];

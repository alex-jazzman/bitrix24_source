<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/active-call.bundle.css',
	'js' => 'dist/active-call.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'call.application.conference-channel',
		'call.lib.call-manager',
		'call.lib.analytics',
		'im.public',
		'im.v2.const',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.button',
		'im.v2.component.elements.avatar',
	],
	'skip_core' => false,
];
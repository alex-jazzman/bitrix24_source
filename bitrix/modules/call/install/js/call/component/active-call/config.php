<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/active-call.bundle.css',
	'js' => 'dist/active-call.bundle.js',
	'rel' => [
		'call.application.conference-channel',
		'call.lib.analytics',
		'call.lib.call-manager',
		'im.public',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.button',
		'im.v2.component.elements.chat-title',
		'im.v2.const',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
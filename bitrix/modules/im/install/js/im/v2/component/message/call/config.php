<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-message.bundle.css',
	'js' => 'dist/call-message.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.call-message',
		'im.v2.component.message.default',
	],
	'skip_core' => true,
];

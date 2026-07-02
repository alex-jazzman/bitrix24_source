<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sound-notification-manager.bundle.css',
	'js' => 'dist/sound-notification-manager.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.call',
		'im.v2.lib.desktop',
		'main.core.events',
	],
	'skip_core' => true,
];
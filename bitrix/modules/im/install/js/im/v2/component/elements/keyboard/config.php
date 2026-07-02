<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/keyboard.bundle.css',
	'js' => 'dist/keyboard.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.phone',
		'im.v2.provider.service.sending',
		'main.core',
	],
	'skip_core' => false,
];

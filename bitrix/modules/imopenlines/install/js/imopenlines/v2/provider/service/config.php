<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/service.bundle.css',
	'js' => 'dist/service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.public',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.provider.service.chat',
		'im.v2.application.core',
		'im.v2.lib.rest',
		'im.v2.lib.notifier',
		'im.v2.lib.logger',
		'imopenlines.v2.const',
	],
	'skip_core' => true,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/service.bundle.css',
	'js' => 'dist/service.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.search',
		'imopenlines.v2.const',
		'imopenlines.v2.lib.search',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];

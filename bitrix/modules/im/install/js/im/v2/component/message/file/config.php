<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/file-message.bundle.css',
	'js' => 'dist/file-message.bundle.js',
	'rel' => [
		'im.v2.component.elements.media-gallery',
		'im.v2.component.elements.player',
		'im.v2.component.elements.progressbar',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.component.message.unsupported',
		'im.v2.const',
		'im.v2.lib.menu',
		'im.v2.lib.notifier',
		'im.v2.lib.utils',
		'im.v2.provider.service.disk',
		'im.v2.provider.service.uploading',
		'main.core',
	],
	'skip_core' => false,
];

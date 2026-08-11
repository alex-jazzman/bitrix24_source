<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'imopenlines.v2.lib.quick-reply',
	],
	'skip_core' => true,
];

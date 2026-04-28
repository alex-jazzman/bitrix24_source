<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/openlines.bundle.css',
	'js' => 'dist/openlines.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'imopenlines.v2.lib.message-manager',
	],
	'skip_core' => true,
];

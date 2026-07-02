<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/file-uploader.bundle.css',
	'js' => 'dist/file-uploader.bundle.js',
	'rel' => [
		'main.core',
		'ui.design-tokens',
		'ui.uploader.tile-widget',
	],
	'skip_core' => false,
];

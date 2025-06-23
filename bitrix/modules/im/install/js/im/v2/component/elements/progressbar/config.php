<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/progressbar.bundle.css',
	'js' => 'dist/progressbar.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.progressbar',
	],
	'skip_core' => true,
];

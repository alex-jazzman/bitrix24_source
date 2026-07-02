<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/worker.bundle.css',
	'js' => 'dist/worker.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];

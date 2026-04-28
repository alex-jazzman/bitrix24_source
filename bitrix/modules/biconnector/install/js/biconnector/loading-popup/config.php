<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/loading-popup.bundle.css',
	'js' => 'dist/loading-popup.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.dialog',
		'ui.system.typography',
	],
	'skip_core' => false,
];

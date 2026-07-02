<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tasks-popup.bundle.css',
	'js' => 'dist/tasks-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.core.z-index-manager',
	],
	'skip_core' => false,
];

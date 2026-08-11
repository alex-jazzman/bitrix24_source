<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/skeleton.bundle.css',
	'js' => 'dist/skeleton.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.skeleton',
	],
	'skip_core' => false,
];

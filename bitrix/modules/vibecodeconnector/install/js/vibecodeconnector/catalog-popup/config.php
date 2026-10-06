<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/popup.bundle.js',
	'css' => './dist/popup.bundle.css',
	'rel' => [
		'main.core',
		'ui.system.dialog',
		'ui.system.skeleton',
	],
	'skip_core' => false,
];

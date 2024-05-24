<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/apache-superset-cleaner.bundle.css',
	'js' => 'dist/apache-superset-cleaner.bundle.js',
	'rel' => [
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];

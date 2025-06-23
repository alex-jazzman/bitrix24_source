<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bottom-sheet.bundle.css',
	'js' => 'dist/bottom-sheet.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];

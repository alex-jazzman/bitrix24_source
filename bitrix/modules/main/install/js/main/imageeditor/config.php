<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/imageeditor.bundle.css',
	'js' => 'dist/imageeditor.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'main.popup',
	],
	'skip_core' => false,
];
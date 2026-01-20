<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/highlighter.bundle.css',
	'js' => 'dist/highlighter.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];

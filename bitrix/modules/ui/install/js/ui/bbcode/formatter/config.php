<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/formatter.bundle.css',
	'js' => 'dist/formatter.bundle.js',
	'rel' => [
		'main.core',
		'ui.bbcode.model',
		'ui.bbcode.parser',
	],
	'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/placeholders-widget.bundle.css',
	'js' => 'dist/placeholders-widget.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sign.v2.grid.b2e.placeholders',
	],
	'skip_core' => false,
];

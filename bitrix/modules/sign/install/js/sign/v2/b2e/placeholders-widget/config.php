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
		'main.loader',
		'sign.v2.api',
		'sign.v2.grid.b2e.placeholders',
		'ui.vue3',
	],
	'skip_core' => false,
];

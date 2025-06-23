<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/datetime-limit-selector.bundle.css',
	'js' => 'dist/datetime-limit-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'sign.v2.api',
		'ui.design-tokens',
	],
	'skip_core' => false,
];

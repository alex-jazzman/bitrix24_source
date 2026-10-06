<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/popover.bundle.js',
	'css' => './dist/popover.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.floating-ui',
	],
	'skip_core' => false,
];

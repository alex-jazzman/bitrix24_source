<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/selector.bundle.css',
	'js' => 'dist/selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.sidepanel.layout',
		'ui.userfieldfactory',
	],
	'skip_core' => false,
];
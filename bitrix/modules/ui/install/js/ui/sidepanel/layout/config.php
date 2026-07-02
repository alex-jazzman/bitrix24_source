<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sidepanel.layout.bundle.css',
	'js' => 'dist/sidepanel.layout.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sidepanel',
		'ui.buttons',
		'ui.fonts.opensans',
		'ui.sidepanel.menu',
	],
	'skip_core' => false,
];

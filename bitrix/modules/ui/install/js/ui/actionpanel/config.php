<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/actionpanel.bundle.css',
	'js' => 'dist/actionpanel.bundle.js',
	'rel' => [
		'main.core',
		'ui.action-panel',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];

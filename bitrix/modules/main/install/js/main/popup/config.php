<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/main.popup.bundle.css',
	'js' => 'dist/main.popup.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.core.z-index-manager',
		'ui.a11y',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];
<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'style.css',
	'js' => 'external-link.bundle.js',
	'rel' => [
		'clipboard',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.layout-form',
		'ui.switcher',
	],
	'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui.buttons.bundle.css',
	'js' => 'dist/ui.buttons.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.cnt',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.switcher',
	],
	'skip_core' => false,
];

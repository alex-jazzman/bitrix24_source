<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/menu.bundle.js',
    'css' => './dist/menu.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
	],
    'skip_core' => false,
];

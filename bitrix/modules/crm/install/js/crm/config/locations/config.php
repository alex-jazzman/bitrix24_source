<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/locations.bundle.js',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.system.dialog',
	],
    'skip_core' => false,
];

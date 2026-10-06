<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/editor-vibeoffice.bundle.js',
    'rel' => [
		'disk.users',
		'main.core',
		'main.core.events',
		'pull.client',
		'ui.buttons',
	],
    'skip_core' => false,
];

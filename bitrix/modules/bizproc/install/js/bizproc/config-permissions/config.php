<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/config-permissions.bundle.js',
    'rel' => [
		'main.polyfill.core',
		'ui.accessrights.v2',
	],
    'skip_core' => true,
];

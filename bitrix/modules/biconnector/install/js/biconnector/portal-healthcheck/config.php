<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/portal-healthcheck.bundle.js',
    'css' => './dist/portal-healthcheck.bundle.css',
    'rel' => [
		'main.core',
		'main.date',
		'ui.design-tokens',
	],
    'skip_core' => false,
];

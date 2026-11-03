<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/maplibre.bundle.js',
    'css' => './dist/maplibre.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

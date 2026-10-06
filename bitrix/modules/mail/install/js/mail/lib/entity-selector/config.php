<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/entity-selector.bundle.js',
    'css' => './dist/entity-selector.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

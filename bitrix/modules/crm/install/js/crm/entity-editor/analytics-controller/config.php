<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/analytics-controller.bundle.js',
    'css' => './dist/analytics-controller.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

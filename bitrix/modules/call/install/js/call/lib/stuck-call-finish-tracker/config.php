<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/stuck-call-finish-tracker.bundle.js',
    'css' => './dist/stuck-call-finish-tracker.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

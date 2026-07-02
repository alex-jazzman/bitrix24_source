<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/request-revision-guard.bundle.js',
    'css' => './dist/request-revision-guard.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

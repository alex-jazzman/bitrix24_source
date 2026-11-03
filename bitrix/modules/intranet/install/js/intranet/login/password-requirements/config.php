<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/password-requirements.bundle.js',
    'css' => './dist/password-requirements.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

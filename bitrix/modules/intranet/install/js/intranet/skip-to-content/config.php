<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/skip-to-content.bundle.js',
    'css' => './dist/skip-to-content.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/color.bundle.js',
    'css' => './dist/color.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

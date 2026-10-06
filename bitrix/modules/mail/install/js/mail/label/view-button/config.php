<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/view-button.bundle.js',
    'css' => './dist/view-button.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

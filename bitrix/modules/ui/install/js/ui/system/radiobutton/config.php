<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/radiobutton.bundle.js',
    'css' => './dist/radiobutton.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/illustration.bundle.js',
    'css' => './dist/illustration.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

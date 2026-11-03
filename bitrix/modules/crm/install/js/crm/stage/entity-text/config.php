<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/entity-text.bundle.js',
    'css' => './dist/entity-text.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

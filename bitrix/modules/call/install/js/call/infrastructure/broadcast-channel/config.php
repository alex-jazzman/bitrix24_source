<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/broadcast-channel.bundle.js',
    'css' => './dist/broadcast-channel.bundle.css',
    'rel' => [
		'main.polyfill.core',
	],
    'skip_core' => true,
];

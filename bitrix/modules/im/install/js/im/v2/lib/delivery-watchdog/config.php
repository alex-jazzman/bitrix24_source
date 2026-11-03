<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/delivery-watchdog.bundle.js',
    'css' => './dist/delivery-watchdog.bundle.css',
    'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'main.core',
	],
    'skip_core' => false,
];

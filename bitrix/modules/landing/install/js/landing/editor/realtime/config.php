<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/realtime.bundle.js',
    'rel' => [
		'landing.history',
		'landing.main',
		'landing.pageobject',
		'landing.realtime',
		'main.core',
	],
    'skip_core' => false,
];

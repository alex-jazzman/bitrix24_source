<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/forward.bundle.js',
    'css' => './dist/forward.bundle.css',
    'rel' => [
		'main.core',
		'ui.a11y',
		'ui.notification',
	],
    'skip_core' => false,
];

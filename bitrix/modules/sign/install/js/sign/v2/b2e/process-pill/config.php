<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/process-pill.bundle.js',
    'css' => './dist/process-pill.bundle.css',
    'rel' => [
		'main.core',
		'sign.v2.api',
		'ui.counterpanel',
	],
    'skip_core' => false,
];

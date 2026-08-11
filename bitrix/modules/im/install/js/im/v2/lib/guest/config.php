<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/guest.bundle.js',
    'css' => './dist/guest.bundle.css',
    'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.permission',
		'main.core',
	],
    'skip_core' => false,
];

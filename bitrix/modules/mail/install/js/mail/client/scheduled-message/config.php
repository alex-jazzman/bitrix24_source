<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/scheduled-message.bundle.js',
    'rel' => [
		'main.core',
		'main.date',
	],
    'skip_core' => false,
];

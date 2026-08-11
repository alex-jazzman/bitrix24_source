<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/call-pip.bundle.js',
    'css' => './dist/call-pip.bundle.css',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
];

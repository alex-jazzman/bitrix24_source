<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/document-process-link.bundle.js',
    'css' => './dist/document-process-link.bundle.css',
    'rel' => [
		'main.core',
		'sign.v2.api',
	],
    'skip_core' => false,
];

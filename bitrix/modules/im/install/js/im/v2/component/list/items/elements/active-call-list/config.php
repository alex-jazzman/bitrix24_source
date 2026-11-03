<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/active-call-list.bundle.js',
    'css' => './dist/active-call-list.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'call.widget.active-call',
		'call.widget.active-call-list',
	],
    'skip_core' => true,
];

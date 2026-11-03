<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/call-hint.bundle.js',
    'css' => './dist/call-hint.bundle.css',
    'rel' => [
		'main.core',
		'ui.bbcode.formatter.html-formatter',
		'ui.navigationpanel',
		'ui.vue3',
	],
    'skip_core' => false,
];

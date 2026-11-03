<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/conference.bundle.js',
    'css' => './dist/conference.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'ui.vue3',
	],
    'skip_core' => true,
];

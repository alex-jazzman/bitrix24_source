<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/picture-in-picture.bundle.js',
    'css' => './dist/picture-in-picture.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'ui.vue3',
	],
    'skip_core' => true,
];

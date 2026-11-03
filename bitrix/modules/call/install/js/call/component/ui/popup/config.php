<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/popup.bundle.js',
    'css' => './dist/popup.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'ui.vue3',
		'ui.vue3.components.popup',
	],
    'skip_core' => true,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/accessible-switcher.bundle.js',
    'css' => './dist/accessible-switcher.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'ui.vue3',
		'ui.vue3.components.switcher',
	],
    'skip_core' => true,
];

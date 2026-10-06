<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/data-formats.bundle.js',
    'css' => './dist/data-formats.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.sidepanel',
		'ui.vue3',
	],
    'skip_core' => false,
];

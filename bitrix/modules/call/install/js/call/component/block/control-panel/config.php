<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/control-panel.bundle.js',
    'css' => './dist/control-panel.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'ui.vue3',
	],
    'skip_core' => true,
];

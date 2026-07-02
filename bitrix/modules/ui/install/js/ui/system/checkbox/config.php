<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/checkbox.bundle.js',
    'css' => './dist/checkbox.bundle.css',
    'rel' => [
		'main.core',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deal-category-list.bundle.js',
    'css' => './dist/deal-category-list.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.notification',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/a11y.bundle.js',
    'css' => './dist/a11y.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.a11y',
	],
    'skip_core' => false,
];

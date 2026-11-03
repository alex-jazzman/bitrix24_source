<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/a11y.bundle.js',
    'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
	],
    'skip_core' => false,
];

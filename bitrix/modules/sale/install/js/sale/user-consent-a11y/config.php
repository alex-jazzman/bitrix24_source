<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/user-consent-a11y.bundle.js',
    'css' => './dist/user-consent-a11y.bundle.css',
    'rel' => [
		'main.core',
		'ui.a11y',
	],
    'skip_core' => false,
];

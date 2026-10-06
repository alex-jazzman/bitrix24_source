<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/labels-guide.bundle.js',
    'css' => './dist/labels-guide.bundle.css',
    'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.banner-dispatcher',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
    'skip_core' => false,
];

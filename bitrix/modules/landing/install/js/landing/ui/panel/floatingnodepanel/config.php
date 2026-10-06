<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/floatingnodepanel.bundle.js',
    'css' => './dist/floatingnodepanel.bundle.css',
    'rel' => [
		'landing.ui.panel.base',
		'main.core',
		'ui.icon-set',
	],
    'skip_core' => false,
];

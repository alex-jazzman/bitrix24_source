<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/element-picker.bundle.js',
    'css' => './dist/element-picker.bundle.css',
    'rel' => [
		'landing.copilot.generation-observer',
		'landing.env',
		'landing.pageobject',
		'main.core',
		'ui.page-context',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/left-panel-resizer.bundle.js',
    'css' => './dist/left-panel-resizer.bundle.css',
    'rel' => [
		'main.core',
		'ui.design-tokens.air',
	],
    'skip_core' => false,
];

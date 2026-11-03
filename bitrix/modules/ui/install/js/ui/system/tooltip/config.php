<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/tooltip.bundle.js',
    'css' => './dist/tooltip.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.system.popover',
	],
    'skip_core' => false,
];

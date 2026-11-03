<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/migration-notice.bundle.js',
    'css' => './dist/migration-notice.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.design-tokens.air',
	],
    'skip_core' => false,
];

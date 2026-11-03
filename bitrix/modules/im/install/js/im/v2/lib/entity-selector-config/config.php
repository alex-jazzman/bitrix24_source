<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/entity-selector-config.bundle.js',
    'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.permission',
	],
    'skip_core' => true,
];

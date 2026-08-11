<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/page-context.bundle.js',
    'css' => './dist/page-context.bundle.css',
    'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'main.core',
		'ui.page-context',
	],
    'skip_core' => false,
];

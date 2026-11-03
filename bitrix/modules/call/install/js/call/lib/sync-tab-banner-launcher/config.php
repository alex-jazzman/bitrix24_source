<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/sync-tab-banner-launcher.bundle.js',
    'rel' => [
		'call.adapter.logger',
		'im.v2.const',
		'main.core',
		'main.core.events',
	],
    'skip_core' => false,
];

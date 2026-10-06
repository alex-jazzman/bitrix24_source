<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/large-attachment.bundle.js',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.banner-dispatcher',
		'ui.info-helper',
	],
    'skip_core' => false,
];

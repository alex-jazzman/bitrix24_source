<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/undo-send.bundle.js',
    'css' => './dist/undo-send.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'ui.banner-dispatcher',
		'ui.notification',
		'ui.progressround',
	],
    'skip_core' => false,
];

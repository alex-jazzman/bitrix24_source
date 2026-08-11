<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
	'js' => './dist/deferred-doc-load.bundle.js',
	'css' => './dist/deferred-doc-load.bundle.css',
	'rel' => [
		'main.core',
		'main.loader',
		'ui.system.typography',
	],
	'skip_core' => false,
	'controllerEntrypoint' => 'BX.Disk.DeferredDocLoad.render',
];

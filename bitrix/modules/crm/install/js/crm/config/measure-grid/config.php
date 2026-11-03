<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/measure-grid.bundle.js',
    'css' => './dist/measure-grid.bundle.css',
    'rel' => [
		'main.core',
		'ui.buttons',
		'ui.notification',
		'ui.stepprocessing',
		'ui.system.dialog',
	],
    'skip_core' => false,
];

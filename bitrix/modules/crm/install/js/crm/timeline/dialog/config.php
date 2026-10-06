<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/dialog.bundle.js',
    'rel' => [
		'main.core',
		'ui.buttons',
		'ui.system.dialog',
	],
    'skip_core' => false,
];

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/editor.bundle.js',
    'css' => './dist/editor.bundle.css',
    'rel' => [
		'mail.lib.entity-selector',
		'main.core',
		'ui.alerts',
		'ui.buttons',
		'ui.entity-selector',
		'ui.notification',
		'ui.switcher',
		'ui.system.radiobutton',
	],
    'skip_core' => false,
];

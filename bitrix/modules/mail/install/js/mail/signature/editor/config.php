<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/editor.bundle.js',
    'css' => './dist/editor.bundle.css',
    'rel' => [
		'disk.disk-picker',
		'mail.lib.entity-selector',
		'main.core',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.entity-selector',
		'ui.loader',
		'ui.notification',
		'ui.switcher',
		'ui.system.alert',
		'ui.system.menu',
		'ui.system.radiobutton',
		'ui.uploader.core',
	],
	'lang' => 'lang/ru/config.php',
    'skip_core' => false,
];

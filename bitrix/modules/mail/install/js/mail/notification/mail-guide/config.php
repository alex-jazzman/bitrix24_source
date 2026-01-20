<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mail-guide.bundle.css',
	'js' => 'dist/mail-guide.bundle.js',
	'rel' => [
		'main.core',
		'ui.banner-dispatcher',
		'main.popup',
	],
	'skip_core' => false,
];

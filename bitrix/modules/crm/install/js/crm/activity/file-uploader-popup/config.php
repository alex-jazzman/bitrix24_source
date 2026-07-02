<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/file-uploader-popup.bundle.css',
	'js' => 'dist/file-uploader-popup.bundle.js',
	'rel' => [
		'crm.activity.file-uploader',
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
	],
	'skip_core' => false,
];

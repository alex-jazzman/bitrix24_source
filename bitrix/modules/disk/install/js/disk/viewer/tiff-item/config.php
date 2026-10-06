<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/disk.tiff-item.bundle.css',
	'js' => 'dist/disk.tiff-item.bundle.js',
	'rel' => [
		'main.core',
		'ui.viewer',
	],
	'skip_core' => false,
];

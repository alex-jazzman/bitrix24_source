<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/disk.markdown-item.bundle.css',
	'js' => 'dist/disk.markdown-item.bundle.js',
	'rel' => [
		'main.core',
		'disk',
		'ui.viewer',
	],
	'skip_core' => false,
];

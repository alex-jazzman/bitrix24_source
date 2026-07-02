<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/pdfjs-viewer.bundle.css',
	'js' => 'dist/pdfjs-viewer.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.pdfjs',
	],
	'skip_core' => true,
];

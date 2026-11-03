<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/peer.bundle.css',
	'js' => 'dist/peer.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];

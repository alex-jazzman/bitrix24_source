<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/create-chat-button.bundle.css',
	'js' => 'dist/create-chat-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
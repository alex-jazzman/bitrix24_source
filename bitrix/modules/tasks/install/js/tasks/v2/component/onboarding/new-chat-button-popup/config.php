<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/new-chat-button-popup.bundle.css',
	'js' => 'dist/new-chat-button-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
];

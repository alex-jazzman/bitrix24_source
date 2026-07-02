<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

return [
	'css' => 'dist/unsupported.bundle.css',
	'js' => 'dist/unsupported.bundle.js',
	'rel' => [
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'main.core',
	],
	'skip_core' => false,
];
<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/collab-invitation.bundle.css',
	'js' => 'dist/collab-invitation.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
	],
	'skip_core' => true,
];

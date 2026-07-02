<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/zoom-invite.bundle.css',
	'js' => 'dist/zoom-invite.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.message.call-invite',
		'im.v2.lib.utils',
		'ui.vue3',
	],
	'skip_core' => true,
];
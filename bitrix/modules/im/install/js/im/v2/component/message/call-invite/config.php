<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

return [
	'css' => 'dist/call-invite.bundle.css',
	'js' => 'dist/call-invite.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.widget.call-invite',
		'im.v2.component.message.default',
		'ui.vue3',
	],
	'skip_core' => true,
];
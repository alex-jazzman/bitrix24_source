<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/create-chat-status.bundle.css',
	'js' => 'dist/create-chat-status.bundle.js',
	'rel' => [
		'im.v2.component.elements.avatar',
		'im.v2.const',
		'im.v2.lib.create-chat',
		'main.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
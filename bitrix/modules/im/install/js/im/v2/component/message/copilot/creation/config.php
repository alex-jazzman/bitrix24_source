<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-creation.bundle.css',
	'js' => 'dist/copilot-creation.bundle.js',
	'rel' => [
		'im.v2.component.elements.avatar',
		'im.v2.component.message.base',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.provider.service.sending',
		'main.core',
	],
	'skip_core' => false,
];

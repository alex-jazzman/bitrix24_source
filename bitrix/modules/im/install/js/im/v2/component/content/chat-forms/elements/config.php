<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.elements.auto-delete',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.button',
		'im.v2.component.elements.dropdown',
		'im.v2.component.elements.hint',
		'im.v2.component.elements.toggle',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.provider.service.chat',
		'main.core',
		'ui.entity-selector',
		'ui.forms',
	],
	'skip_core' => false,
];

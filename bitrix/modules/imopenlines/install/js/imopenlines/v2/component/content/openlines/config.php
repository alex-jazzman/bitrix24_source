<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/openlines.bundle.css',
	'js' => 'dist/openlines.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'imopenlines.v2.css.tokens',
		'im.v2.lib.logger',
		'im.v2.provider.service.chat',
		'im.v2.component.dialog.chat',
		'imopenlines.v2.lib.queue',
		'main.popup',
		'im.v2.component.elements.popup',
		'ui.entity-selector',
		'im.v2.component.search',
		'im.public',
		'im.v2.component.elements.button',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.application.core',
		'imopenlines.v2.const',
		'imopenlines.v2.provider.service',
		'im.v2.component.content.elements',
		'im.v2.component.textarea',
		'im.v2.lib.menu',
		'im.v2.lib.theme',
	],
	'skip_core' => true,
];

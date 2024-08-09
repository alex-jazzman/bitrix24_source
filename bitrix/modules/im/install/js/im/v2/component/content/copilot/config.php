<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-content.bundle.css',
	'js' => 'dist/copilot-content.bundle.js',
	'rel' => [
		'im.v2.lib.logger',
		'im.v2.lib.theme',
		'im.v2.lib.textarea',
		'im.v2.component.sidebar',
		'im.v2.lib.analytics',
		'ui.notification',
		'main.core.events',
		'im.v2.lib.promo',
		'im.v2.component.entity-selector',
		'main.popup',
		'im.public',
		'im.v2.const',
		'im.v2.provider.service',
		'im.v2.component.textarea',
		'im.v2.lib.draft',
		'ui.vue3',
		'im.v2.component.dialog.chat',
		'im.v2.component.elements',
		'main.core',
		'im.v2.component.message-list',
		'im.v2.lib.copilot',
	],
	'skip_core' => false,
];
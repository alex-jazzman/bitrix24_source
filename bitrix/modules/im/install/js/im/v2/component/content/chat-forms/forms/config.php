<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.component.content.chat-forms.elements',
		'im.v2.component.elements.avatar',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.confirm',
		'im.v2.lib.create-chat',
		'im.v2.lib.feature',
		'im.v2.lib.helpdesk',
		'im.v2.lib.layout',
		'im.v2.lib.notifier',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'main.core',
		'main.core.events',
		'main.popup',
		'socialnetwork.collab.access-rights',
		'socialnetwork.v2.application.project-wizard',
		'socialnetwork.v2.model.interface',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];

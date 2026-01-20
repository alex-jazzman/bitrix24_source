<?php


if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.lib.date-formatter',
		'ui.vue3',
		'im.v2.component.elements.attach',
		'im.v2.component.elements.keyboard',
		'main.core.events',
		'ui.reaction.item.vue',
		'im.v2.component.elements.user-list-popup',
		'im.v2.provider.service.user',
		'im.v2.lib.logger',
		'im.v2.lib.rest',
		'ui.reactions-select',
		'ui.reaction.picker',
		'ui.reaction.item',
		'im.v2.lib.feature',
		'im.v2.component.elements.chat-title',
		'im.v2.lib.utils',
		'im.v2.application.core',
		'im.v2.lib.menu',
		'im.v2.provider.service.sending',
		'im.v2.provider.service.message',
		'im.v2.provider.service.uploading',
		'ui.system.menu',
		'ui.icon-set.api.vue',
		'im.v2.lib.copilot',
		'im.v2.const',
		'im.v2.component.elements.avatar',
		'im.v2.lib.permission',
		'im.v2.component.animation',
		'im.v2.provider.service.comments',
		'im.v2.lib.parser',
		'main.core',
		'im.v2.lib.channel',
	],
	'skip_core' => false,
];
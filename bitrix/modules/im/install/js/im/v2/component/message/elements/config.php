<?php


if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.animation',
		'im.v2.component.elements.attach',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.chat-title',
		'im.v2.component.elements.keyboard',
		'im.v2.component.elements.media-gallery',
		'im.v2.component.elements.player',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.progressbar',
		'im.v2.component.elements.user-list-popup',
		'im.v2.const',
		'im.v2.lib.channel',
		'im.v2.lib.copilot',
		'im.v2.lib.date-formatter',
		'im.v2.lib.logger',
		'im.v2.lib.menu',
		'im.v2.lib.parser',
		'im.v2.lib.permission',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'im.v2.provider.service.comments',
		'im.v2.provider.service.message',
		'im.v2.provider.service.sending',
		'im.v2.provider.service.uploading',
		'im.v2.provider.service.user',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.icon-set.api.vue',
		'ui.icons.disk',
		'ui.lottie',
		'ui.reaction.item',
		'ui.reaction.item.vue',
		'ui.reaction.picker',
		'ui.sidepanel.layout',
		'ui.system.chip.vue',
		'ui.system.menu',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];

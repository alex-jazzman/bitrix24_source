<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent-container.bundle.css',
	'js' => 'dist/recent-container.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.component.elements.copilot-roles-dialog',
		'im.v2.component.elements.menu',
		'im.v2.component.list.container.elements.create-chat-promo',
		'im.v2.component.list.container.elements.header-menu',
		'im.v2.component.list.container.elements.vibe-code-catalog-button',
		'im.v2.component.list.items.recent',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.copilot',
		'im.v2.lib.create-chat',
		'im.v2.lib.feature',
		'im.v2.lib.helpdesk',
		'im.v2.lib.invite',
		'im.v2.lib.logger',
		'im.v2.lib.permission',
		'im.v2.lib.promo',
		'im.v2.provider.service.copilot',
		'main.core',
		'main.core.events',
		'ui.icon-set.api.vue',
		'ui.info-helper',
	],
	'skip_core' => false,
];

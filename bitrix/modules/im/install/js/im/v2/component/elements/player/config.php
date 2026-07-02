<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.animation',
		'im.v2.component.elements.avatar',
		'im.v2.component.elements.loader',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.copilot',
		'im.v2.lib.feature',
		'im.v2.lib.local-storage',
		'im.v2.lib.parser',
		'im.v2.lib.utils',
		'im.v2.provider.service.message',
		'main.polyfill.intersectionobserver',
		'ui.fonts.opensans',
		'ui.icon-set.api.vue',
		'ui.icon-set.small-outline',
		'ui.info-helper',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => true,
];

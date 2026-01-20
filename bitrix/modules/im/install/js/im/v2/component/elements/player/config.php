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
		'ui.icon-set.api.vue',
		'ui.icon-set.small-outline',
		'im.v2.component.elements.loader',
		'im.v2.provider.service.message',
		'ui.fonts.opensans',
		'main.polyfill.intersectionobserver',
		'im.v2.lib.feature',
		'main.core.events',
		'im.v2.lib.local-storage',
		'im.v2.component.elements.avatar',
		'im.v2.lib.analytics',
		'ui.info-helper',
		'ui.vue3.components.rich-loc',
		'im.v2.component.animation',
		'im.v2.const',
		'im.v2.lib.parser',
		'im.v2.lib.utils',
	],
	'skip_core' => true,
];

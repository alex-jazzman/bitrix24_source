<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/player-bar.bundle.js',
    'css' => './dist/player-bar.bundle.css',
    'rel' => [
		'im.v2.component.elements.player',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.lib.playback',
		'im.v2.lib.utils',
		'main.core',
		'ui.a11y',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
	],
    'skip_core' => false,
];

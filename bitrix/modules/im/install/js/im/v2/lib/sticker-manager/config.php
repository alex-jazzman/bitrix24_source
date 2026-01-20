<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

return [
	'js' => 'dist/sticker-manager.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'im.v2.application.core',
	],
	'skip_core' => true,
];

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vote.bundle.css',
	'js' => 'dist/vote.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'im.v2.const',
		'vote.store.vote',
		'vote.provider.pull',
	],
	'skip_core' => true,
];


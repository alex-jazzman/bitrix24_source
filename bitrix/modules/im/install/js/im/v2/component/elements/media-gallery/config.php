<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/media-gallery.bundle.css',
	'js' => 'dist/media-gallery.bundle.js',
	'rel' => [
		'im.v2.component.elements.progressbar',
		'im.v2.const',
		'im.v2.lib.utils',
		'main.core',
		'ui.icon-set.api.core',
		'ui.vue3.directives.lazyload',
	],
	'skip_core' => false,
];

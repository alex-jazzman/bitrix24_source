<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/create-chat-promo.bundle.css',
	'js' => 'dist/create-chat-promo.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.button',
		'im.v2.component.elements.popup',
		'im.v2.const',
		'ui.lottie',
	],
	'skip_core' => true,
];
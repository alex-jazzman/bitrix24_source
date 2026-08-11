<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Shared static assets under /bitrix/js/note/ui/assets/images/, plus a tiny JS
// bundle exposing their canonical URLs (AssetUrl) so JS consumers import the path
// from one place instead of hardcoding it. CSS/PHP consumers reference the same
// published paths directly.

return [
	'js' => './dist/assets.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];

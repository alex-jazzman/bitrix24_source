<?php

use Bitrix\Main\Config\Feature;
use Bitrix\UI\Config\Feature\RichTextUserFieldFlag;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$richTextEnabled =
	class_exists(Feature::class)
	&& class_exists(RichTextUserFieldFlag::class)
	&& Feature::isEnabled(RichTextUserFieldFlag::class)
;

return [
	'css' => 'dist/userfieldfactory.bundle.css',
	'js' => 'dist/userfieldfactory.bundle.js',
	'rel' => [
		'main.core',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'main.popup',
		'sidepanel',
		'ui.userfield',
	],
	'skip_core' => false,
	'settings' => [
		'richTextEnabled' => $richTextEnabled,
	],
];

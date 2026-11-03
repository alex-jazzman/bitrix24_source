<?php
use Bitrix\Main\Config\Configuration;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [
	'autoHide' => true,
	'autoHideDelayFactor' => 1,
];

$configuration = Configuration::getValue('ui');
if (isset($configuration['notification']) && is_array($configuration['notification']))
{
	$settings = array_merge($settings, $configuration['notification']);
}

return [
	"css" => "./dist/notification.bundle.css",
	"js" => "./dist/notification.bundle.js",
	"rel" => [
		"main.core",
		"ui.a11y",
		"ui.design-tokens",
		"ui.design-tokens.air",
	],
	"skip_core" => false,
	"settings" => $settings,
];

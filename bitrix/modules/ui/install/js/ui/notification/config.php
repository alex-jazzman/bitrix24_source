<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	"css" => "./dist/notification.bundle.css",
	"js" => "./dist/notification.bundle.js",
	"rel" => [
		"main.core",
		"ui.design-tokens",
		"ui.design-tokens.air",
	],
	"skip_core" => false,
];

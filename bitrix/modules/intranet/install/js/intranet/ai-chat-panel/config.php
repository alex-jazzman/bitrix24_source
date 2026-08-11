<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Intranet\Integration\Templates\Bitrix24\ThemePicker;
use Bitrix\Main\Loader;
use Bitrix\Main\Page\Asset;

$contextClass = '';
$themeCssPaths = [];
if (Loader::includeModule('intranet'))
{
	$picker = new ThemePicker('bitrix24');
	$baseThemeId = $picker->getCurrentBaseThemeId();
	if ($baseThemeId === 'dark' || $baseThemeId === 'default')
	{
		$contextClass = '--ui-context-edge-light';
	}
	elseif ($baseThemeId === 'light')
	{
		$contextClass = '--ui-context-edge-dark';
	}

	$theme = $picker->getCurrentTheme();
	if (is_array($theme) && !empty($theme['css']) && is_array($theme['css']))
	{
		foreach ($theme['css'] as $cssUrl)
		{
			if (preg_match('#/base\.css(?:\?|$)#', $cssUrl))
			{
				continue;
			}

			$themeCssPaths[] = Asset::getAssetPath($cssUrl);
		}
	}
}


return [
	'js' => 'dist/ai-chat-panel.bundle.js',
	'css' => array_merge(
		['dist/ai-chat-panel.bundle.css'],
		$themeCssPaths,
	),
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
	],
	'skip_core' => false,
	'settings' => [
		'contextClass' => $contextClass,
	],
];

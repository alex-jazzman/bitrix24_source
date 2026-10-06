<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Copilot\Services\NameService;
use Bitrix\Main\Localization\Loc;

$return = [
	'block' => [
		'name' => NameService::replaceCopilotName(
			Loc::getMessage('LANDING_BLOCK_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_NAME_AI')),
		'type' => ['vibe'],
		'section' => ['widgets_automation'],
		'system' => true,
	],
	'cards' => [],
	'nodes' => [
		'bitrix:landing.blocks.mp_widget.west_auto_overview_block' => [
			'type' => 'component',
			'extra' => [
				'editable' => [],
			],
		],
	],
	'style' => [
		'block' => [
			'type' => ['widget'],
		],
		'nodes' => [],
	],
];

return $return;

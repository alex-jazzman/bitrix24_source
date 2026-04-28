<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Vibe\Vibe;
use \Bitrix\Main\Localization\Loc;

$return = [
	'block' => [
		'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_BP_NAME_NEW'),
		'type' => ['vibe'],
		'section' => ['widgets_automation', 'widgets_hr'],
		'disableEditButton' => Vibe::isUseDemoData(),
	],
	'nodes' => [
		"bitrix:landing.blocks.mp_widget.bp" => [
			'type' => 'component',
			'extra' => [
				'editable' => [
					'TITLE' => [],
					'SORT' => [],
					'BUTTON' => [],
					// visual
					'COLOR_HEADERS' => [
						'style' => true,
					],
					'COLOR_BG' => [
						'style' => true,
					],
					'COLOR_BG_BUTTON' => [
						'style' => true,
					],
					'COLOR_BUTTON_TEXT' => [
						'style' => true,
					],
					'COLOR_BUTTON' => [
						'style' => true,
					],
				],
			],
		],
	],
	'style' => [
		'block' => [
			'type' => ['widget', 'font-family'],
		],
	],
];

return $return;
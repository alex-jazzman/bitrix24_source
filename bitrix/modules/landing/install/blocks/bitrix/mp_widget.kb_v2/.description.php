<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Vibe\Vibe;
use \Bitrix\Main\Localization\Loc;

$return = [
	'block' => [
		'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_KB_V2_NAME_NEW'),
		'type' => ['vibe'],
		'section' => ['widgets_new_employees', 'widgets_hr'],
		'attrsFormDescription' => Loc::getMessage('LANDING_BLOCK_WIDGET_KB_V2_HINT'),
		'attrsFormDescriptionHintStyle' => 'blueHint',
		'disableEditButton' => Vibe::isUseDemoData(),
	],
	'nodes' => [
		"bitrix:landing.blocks.mp_widget.kb" => [
			'type' => 'component',
			'extra' => [
				'editable' => [
					'TITLE' => [],
					'SORT' => [],
					// visual
					'COLOR_HEADERS_V2' => [
						'style' => true,
					],
					'COLOR_BUTTON_V2' => [
						'style' => true,
					],
				],
			],
		],
	],
	'style' => [
		'block' => [
			'type' => ['widget'],
		],
	],
];

return $return;
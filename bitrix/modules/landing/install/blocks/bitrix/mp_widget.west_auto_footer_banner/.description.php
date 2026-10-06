<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$return = [
	'block' => [
		'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_WEST_AUTO_VIBE_FOOTER_BANNER_NAME'),
		'type' => ['vibe'],
		'section' => ['widgets_automation'],
		'system' => true,
	],
	'cards' => [],
	'nodes' => [
		'bitrix:landing.blocks.mp_widget.west_auto_footer_banner' => [
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

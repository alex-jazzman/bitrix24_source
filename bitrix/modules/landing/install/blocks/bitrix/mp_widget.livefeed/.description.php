<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Vibe\Vibe;
use \Bitrix\Main\Localization\Loc;

$helpUrl = \Bitrix\Landing\Help::getHelpUrl('WIDGET_LIVEFEED');
$hint = Loc::getMessage('LANDING_BLOCK_WIDGET_LIVEFEED_HINT', ['#LINK#' => $helpUrl]);
$return = [
	'block' => [
		'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_LIVEFEED_NAME_NEW'),
		'type' => ['vibe'],
		'section' => ['widgets_company_life', 'widgets_hr'],
		'attrsFormDescription' => $hint,
		'attrsFormDescriptionHintStyle' => 'blueHint',
		'disableEditButton' => Vibe::isUseDemoData(),
	],
	'nodes' => [
		"bitrix:landing.blocks.mp_widget.livefeed" => [
			'type' => 'component',
			'extra' => [
				'editable' => [
					'TITLE' => [],
					'GROUP_ID' => [],
					// visual
					'COLOR_HEADERS' => [
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
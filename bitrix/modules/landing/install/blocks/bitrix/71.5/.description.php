<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$return = [
	'block' => [
		'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NAME'),
		'type' => ['page', 'store', 'smn', 'knowledge', 'group', 'mainpage'],
		'section' => ['columns', 'widgets_columns'],
		'system' => true,
	],
	'cards' => [
		'.landing-block-node-card' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD'),
			'label' => ['.landing-block-node-card-title'],
		],
	],
	'nodes' => [
		'.landing-block-node-title' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_TITLE'),
			'type' => 'text',
		],
		'.landing-block-node-subtitle' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_SUBTITLE'),
			'type' => 'text',
		],
		'.landing-block-node-text' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_TEXT'),
			'type' => 'text',
		],
		'.landing-block-node-tab' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_BADGE'),
			'type' => 'text',
		],
		'.landing-block-node-card-title' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_TITLE'),
			'type' => 'text',
		],
		'.landing-block-node-card-text' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_TEXT'),
			'type' => 'text',
		],
		'.landing-block-node-card-btn' => [
			'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_BUTTON'),
			'type' => 'link',
		],
	],
	'style' => [
		'block' => [
			'type' => ['widget'],
		],
		'nodes' => [
			'.landing-block-container' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CONTAINER'),
				'type' => ['background'],
			],
			'.landing-block-node-title' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_TITLE'),
				'type' => ['typo'],
			],
			'.landing-block-node-subtitle' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_SUBTITLE'),
				'type' => ['typo'],
			],
			'.landing-block-node-text' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_TEXT'),
				'type' => ['typo'],
			],
			'.landing-block-node-tab' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_BADGE'),
				'type' => ['display-element', 'background-color', 'typo'],
			],
			'.landing-block-node-card' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD'),
				'type' => ['background-color'],
			],
			'.landing-block-node-card-title' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_TITLE'),
				'type' => ['typo'],
			],
			'.landing-block-node-card-text' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_TEXT'),
				'type' => ['typo'],
			],
			'.landing-block-node-card-btn' => [
				'name' => Loc::getMessage('LANDING_BLOCK_WIDGET_71_5_NODE_CARD_BUTTON'),
				'type' => ['button-type', 'color', 'color-hover', 'background-color', 'background-color-hover'],
			],
		],
	],
	'assets' => [
		'ext' => ['landing_carousel'],
	],
];

return $return;
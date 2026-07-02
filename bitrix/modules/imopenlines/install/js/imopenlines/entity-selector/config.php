<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('imopenlines'))
{
	return [];
}

return [
	'settings' => [
		'entities' => [
			[
				'id' => 'imopenlines-crm-form',
				'options' => [
					'dynamicLoad' => true,
					'dynamicSearch' => true
				],
			],
			[
				'id' => 'queue',
				'options' => [
					'tagOptions' => [
						'default' => [
							'textColor' => '#1066bb',
							'bgColor' => '#bcedfc',
							'avatarOptions' => [
								'icon' => 'o-open-channels',
								'iconColor' => '#ffffff',
								'bgColor' => '#92B3C1',
								'borderRadius' => '50%',
							],
						],
					],
				],
			],
		],
	],
];

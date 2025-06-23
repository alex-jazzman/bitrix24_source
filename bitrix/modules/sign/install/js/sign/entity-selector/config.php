<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('sign'))
{
	return [];
}

return [
	'settings' => [
		'entities' => [
			[
				'id' => 'sign-document',
				'options' => [
					'dynamicLoad' => true,
					'dynamicSearch' => true,
				],
			],
			[
				'id' => 'sign-fired-user',
				'options' => [
					'dynamicLoad' => true,
					'dynamicSearch' => true,
				],
			],
		]
	]
];
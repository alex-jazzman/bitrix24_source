<?php
return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\MessageService\\Controller',
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'messageservice.public.ui.factory' => [
				'className' => \Bitrix\MessageService\Public\UI\Factory::class,
			],
		],
		'readonly' => true,
	],
];

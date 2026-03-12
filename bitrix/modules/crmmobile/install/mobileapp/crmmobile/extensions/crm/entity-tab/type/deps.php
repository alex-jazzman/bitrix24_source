<?php

return [
	'extensions' => [
		'alert',
		'apptheme',
		'communication/phone-menu',
		'layout/ui/empty-screen',
		'layout/ui/feature-banner',
		'layout/ui/item-selector',
		'layout/ui/menu',
		'loc',
		'notify',
		'ui-system/blocks/icon',
		'crm:entity-chat-opener',
		'crm:type',
	],
	'bundle' => [
		'./entities/base',
		'./entities/company',
		'./entities/contact',
		'./entities/deal',
		'./entities/dynamic',
		'./entities/lead',
		'./entities/quote',
		'./entities/smart-invoice',
		'./traits/exclude-item',
		'./traits/open-chat',
	],
];

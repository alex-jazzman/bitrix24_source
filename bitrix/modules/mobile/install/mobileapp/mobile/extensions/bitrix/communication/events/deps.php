<?php

return [
	'extensions' => [
		'in-app-url',
		'utils/string',
		'utils/url',
		'utils/object',
		'im:messenger/api/dialog-opener',
		'communication/phone-menu',
	],
	'bundle' => [
		'./base',
		'./email',
		'./web',
		'./phone',
		'./im',
	],
];
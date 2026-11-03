<?php

return [
	'extensions' => [
		'type',
		'layout/ui/smartphone-contact-selector',
		'im:messenger/loc',
		'im:messenger/lib/logger',
		'im:messenger/provider/services/sending',
	],
	'bundle' => [
		'./src/contact-sender',
	],
];

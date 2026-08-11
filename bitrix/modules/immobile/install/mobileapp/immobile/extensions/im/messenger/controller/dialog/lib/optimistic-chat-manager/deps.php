<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/feature',
		'im:messenger/lib/visibility-manager',
		'im:messenger/controller/dialog/lib/loc',
		'im:messenger/controller/dialog/lib/assistant-button-manager',
	],
	'bundle' => [
		'./src/manager',
		'./src/text-field-handler',
		'./src/assistant-button-manager',
	],
];

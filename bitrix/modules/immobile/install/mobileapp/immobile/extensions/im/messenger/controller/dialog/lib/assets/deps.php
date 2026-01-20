<?php

return [
	'extensions' => [
		'im:messenger/assets/copilot',
		'im:messenger/assets/common',
		'im:messenger/lib/logger',
		'im:messenger/lib/reaction-assets-manager',
		'im:messenger/lib/background-cache',
	],
	'bundle' => [
		'./src/chat-assets',
		'./src/copilot-assets',
	],
];

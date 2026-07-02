<?php

return [
	'extensions' => [
		'elements-stack',
		'tokens',
		'ui-system/blocks/avatar',
		'ui-system/typography/text',
		'utils/date/duration',
		'utils/object',
	],
	'bundle' => [
		'./src/constants',
		'./src/elements-stack-steps',
		'./src/step',
		'./src/stack',
		'./src/stick',

		'./src/block/text',
		'./src/block/text-stub',
		'./src/block/duration',
		'./src/block/avatar',
		'./src/block/avatar-stub',
		'./src/block/counter',
	],
];

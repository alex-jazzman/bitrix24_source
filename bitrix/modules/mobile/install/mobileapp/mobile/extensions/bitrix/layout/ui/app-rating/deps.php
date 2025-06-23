<?php

return [
	'extensions' => [
		'apptheme',
		'asset-manager',
		'analytics',
		'bottom-sheet',
		'feature',
		'layout/ui/feedback-form-opener',
		'layout/ui/star-rating',
		'loc',
		'rest/run-action-executor',
		'tokens',
		'ui-system/layout/box',
		'ui-system/form/buttons/button',
		'ui-system/layout/dialog-footer',
		'ui-system/layout/area',
		'ui-system/layout/area-list',
		'ui-system/typography/text',
		'ui-system/typography/heading',
		'ui-system/blocks/status-block',

		'im:messenger/api/dialog-opener',
	],
	'bundle' => [
		'./src/box-strategy',
		'./src/support-chat-strategy',
		'./src/go-to-store-strategy',
		'./src/rating-constants',
		'./src/analytics',
	],
];

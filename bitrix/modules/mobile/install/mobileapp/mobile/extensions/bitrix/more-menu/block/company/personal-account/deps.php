<?php

return [
	'extensions' => [
		'loc',
		'tokens',

		'ui-system/layout/card',
		'ui-system/layout/box',
		'ui-system/layout/dialog-footer',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'ui-system/form/inputs/input',
		'ui-system/form/inputs/string',
		'ui-system/form/buttons/button',

		'layout/ui/step-progress-bar',
		'layout/ui/loaders/spinner',

		'bottom-sheet',
		'toast',

		'rest/run-action-executor',
		'pull/client/events',

		'utils/validation',
		'utils/test',
		'utils/date',

		'layout/pure-component',

		'debug/prism',
	],
	'bundle' => [
		'./src/api/salary-vacation-api',
		'./src/pull/pull-handler',
		'./src/flow',
		'./src/slides/stepper-slide',
		'./src/slides/document-slide',
		'./src/steps/form-step',
		'./src/steps/pin-step',
		'./src/steps/resend-button',
		'./src/steps/document-view',
	],
];

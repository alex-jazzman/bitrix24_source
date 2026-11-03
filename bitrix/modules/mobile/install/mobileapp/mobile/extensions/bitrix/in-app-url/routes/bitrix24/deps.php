<?php

return [
	'extensions' => [
		'require-lazy',
		'loc',
		'rest/run-action-executor',
		'toast',
		'tourist',
		'whats-new/ui-manager/component-opener',
	],
	'components' => [
		'user.profile', // @keep the profile route opens the component by name at runtime
	],
];

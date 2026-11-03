<?php

return [
	'extensions' => [
		'alert',
		'asset-manager',
		'bottom-sheet',
		'loc',
		'notify',
		'qrauth/utils',
		'require-lazy',
		'rest', // @keep
		'rest/run-action-executor',
		'selector/widget/entity/socialnetwork/user',
		'tokens',
		'ui-system/blocks/status-block',
		'ui-system/form/buttons/button',
		'ui-system/layout/box',
		'ui-system/layout/dialog-footer',
		'utils/test',
		'utils/validation',
	],
	'bundle' => [
		'./src/dispatcher',
		'./src/flow',
		'./src/screen/base-screen',
		'./src/screen/portal-delete',
		'./src/screen/request-chat',
		'./src/screen/transfer-rights-free',
		'./src/screen/transfer-rights-paid',
	],
];

<?php

return [
	'extensions' => [
		'require-lazy',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/emitter',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/helper',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/provider/services/analytics',
		'im:messenger/controller/selector/dialog/opener',
	],
];

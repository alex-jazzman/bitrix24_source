<?php

return [
	'extensions' => [
		'type',
		'im:messenger/controller/recent/lib',
		'utils/object',
		'im:messenger/const',
		'im:messenger/cache',
		'im:messenger/provider/rest',
		'im:messenger/lib/logger',
		'im:messenger/lib/converter/ui/recent',
		'im:messenger/provider/rest',
		'im:messenger/lib/emitter',
		'im:messenger/lib/counters/tab-counters',
		'im:messenger/lib/counters/counter-manager/messenger/sender',
		'im:messenger/lib/counters/counter-manager/messenger/actions',
		'im:messenger/lib/integration/callmobile/call-manager',
		'im:messenger/provider/data',
	],
	'bundle' => [
		'./src/recent',
	],
];
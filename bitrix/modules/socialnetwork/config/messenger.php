<?php

use Bitrix\Socialnetwork\V2\Internal\Service\StructureSync\Async\StructureSyncReceiver;

return [
	'value' => [
		'queues' => [
			/** @see \Bitrix\Socialnetwork\V2\Internal\Async\QueueId */
			'socialnetwork_structure_sync' => [
				'handler' => StructureSyncReceiver::class,
				'retry_strategy' => [
					'max_retries' => 5,
					'delay' => 5,
					'multiplier' => 3,
				],
			],
		],
	],
	'readonly' => true,
];

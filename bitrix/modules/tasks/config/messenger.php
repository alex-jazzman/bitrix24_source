<?php

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Async\Receiver\AddDavSync;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Async\Receiver\AddLastActivity;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Async\Receiver\AddSearchIndex;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Async\Receiver\RecountSort;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Async\Receiver\UpdateDavSync;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Async\Receiver\UpdateSearchIndex;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Async\Receiver\UpdateTopic;

return  [
	'value' => [
		'queues' => [
			/** @see QueueId */
			'add_task_search_index' => [
				'handler' => AddSearchIndex::class,
			],
			'update_task_search_index' => [
				'handler' => UpdateSearchIndex::class,
			],
			'add_task_dav_sync' => [
				'handler' => AddDavSync::class,
			],
			'update_task_dav_sync' => [
				'handler' => UpdateDavSync::class
			],
			'add_task_last_activity' => [
				'handler' => AddLastActivity::class
			],
			'update_task_topic' => [
				'handler' => UpdateTopic::class
			],
			'recount_task_sort' => [
				'handler' => RecountSort::class
			],
		],
	],
	'readonly' => true,
];
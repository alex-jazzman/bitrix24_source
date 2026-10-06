<?php

use Bitrix\Socialnetwork\V2\Internal\Integration\Im;

return [
	'value' => [
		\Bitrix\Im\V2\Chat\ExternalChat\Event\AfterReadMessagesEvent::class => [
			Im\EventHandler\OnAfterReadMessages\UpdateFeedCounters::class,
		],
		\Bitrix\Im\V2\Chat\ExternalChat\Event\AfterReadAllMessagesEvent::class => [
			Im\EventHandler\OnAfterReadAllMessages\UpdateFeedCounters::class,
		],
		// Global "read all chats" (messenger funnel -> "read all"): the bulk
		// Reader::readAll path does not emit the per-chat read-all event, so the
		// per-chat handler above never runs. Subscribe to the shared event too.
		\Bitrix\Im\V2\Message\Event\AfterReadAllChatsEvent::class => [
			Im\EventHandler\OnAfterReadAllChats\UpdateFeedCounters::class,
		],
	],
];

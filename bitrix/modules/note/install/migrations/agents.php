<?php

use Bitrix\Main\UpdateSystem\Migration;
use Bitrix\Note\Infrastructure\Agent\Freshness\DerivedProjectionAgent;
use Bitrix\Note\Infrastructure\Agent\Link\DocumentLinkBackfillAgent;
use Bitrix\Note\Infrastructure\Agent\Notification\NotificationDrainAgent;
use Bitrix\Note\Infrastructure\Agent\RecycleBin\RecycleBinCleanupAgent;
use Bitrix\Note\Infrastructure\Agent\Version\VersionCleanupAgent;

$agent = Migration::getInstance()->agent();

$agent->add([RecycleBinCleanupAgent::class, 'run'], 7200, false);
$agent->add([VersionCleanupAgent::class, 'run'], 7200, false);

// [P4.T1] Permanent freshness agent: drains the IS_DERIVED_STALE dirty queue and rebuilds search +
// link indexes for the touched documents. Registered unconditionally (no kill-switch) like the drainer.
$agent->add([DerivedProjectionAgent::class, 'run'], 300, false);
// [P4.T6] SubtreeAclReconcileAgent is deliberately absent: it registers itself on demand, when a
// grant above the widen threshold is deferred, and unregisters as soon as its queue drains. Adding
// it here would resurrect a background tick that has nothing to do on an idle portal.

// Literal 300 = Configuration::NOTIFY_INTERVAL_DEFAULT. Not read through getNotifyInterval() here:
// migrations run before the module is loaded, so note lib classes aren't autoloadable yet. The
// note:activity_enabled kill-switch is checked inside the tick, so registration is unconditional.
$agent->add([NotificationDrainAgent::class, 'run'], 300, false);

// [P4.T2] One-time pass filling the link index for content written before the feature; it removes
// itself as soon as the scan reaches the end. On a fresh install that is the very first tick — there
// is nothing to index — so the row costs one empty scan and disappears. An already installed portal
// never replays install migrations, so the same registration is repeated in the updater.
$agent->add([DocumentLinkBackfillAgent::class, 'run'], 300, false);

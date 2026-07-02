<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;

/**
 * @var array $arResult
 */

if (Loader::includeModule('extranet') && \CExtranet::IsExtranetSite())
{
	return;
}

$frame = $this->createFrame()->begin('');

if ($arResult['SHOW_DEMO_POPUP'])
{
	?>
	<script>
		BX.ready(() => {
			const canInvite = <?= Json::encode($arResult['CAN_INVITE']) ?>;
			BX.loadExt(['bitrix24.demo-invite-popup', 'ui.banner-dispatcher'])
				.then((exports) => {
					const { DemoInvitePopup, BannerDispatcher } = exports;
					BannerDispatcher.normal.toQueue(async (onDone) => {
						const popup = (new DemoInvitePopup(canInvite)).show();
						popup.subscribe('onClose', () => {
							onDone();
						});
					});
				});
		});
	</script>
	<?php
	$frame->end();
	return;
}

$notification = (new Bitrix\Bitrix24\Service\InvitationPushNotificationService())->createInvitationNotification();
if (!is_null($notification))
{
	\Bitrix\Main\UI\Extension::load([
		'intranet.invitation-notification',
	]);
	?>
	<script>
		BX.ready(() => {
			setTimeout(() => {
				(new BX.Intranet.InvitationNotification(<?= Json::encode($notification) ?>)).show();
			}, 0);
		});
	</script>
	<?php
}
$frame->end();

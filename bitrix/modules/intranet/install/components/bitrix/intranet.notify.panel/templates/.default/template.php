<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web;

$this->setFrameMode(true);

if ($arResult['collaboration_balloon_menu_id'] !== null):
?>
	<script>
		BX.ready(() => {
			const menuId = <?= Web\Json::encode($arResult['collaboration_balloon_menu_id']) ?>;
			let root = document.getElementById('air-header-menu');
			const selector = `[data-top-menu-id="${CSS.escape(menuId)}"][data-item]`;
			let started = false;
			let observer;
			const start = () => {
				const anchor = [...(root?.querySelectorAll(selector) ?? [])].find((item) =>
					item.getClientRects().length > 0 && getComputedStyle(item).visibility !== 'hidden');
				if (started || !anchor)
				{
					return;
				}

				started = true;
				observer?.disconnect();
				BX.ajax.runAction('intranet.v2.CollaborationMenuBalloon.getDecision', {
					data: { onMessengerPage: /(?:^|\/)online(?:\/|$)/.test(location.pathname) ? 1 : 0 },
				}).then(({ data }) => {
					if (!['show', 'mark'].includes(data))
					{
						return;
					}

					return BX.loadExt('intranet.collaboration-menu-balloon').then(() => {
						new BX.Intranet.CollaborationMenuBalloon({ menuId, decision: data }).show();
					});
				}).catch(() => {});
			};
			const watchMenu = () => {
				start();
				if (started)
				{
					return;
				}

				observer = new MutationObserver(start);
				observer.observe(root, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['class', 'style', 'hidden', 'data-top-menu-id'],
				});
				window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
			};
			if (root)
			{
				watchMenu();
			}
			else
			{
				const headerObserver = new MutationObserver(() => {
					root = document.getElementById('air-header-menu');
					if (root)
					{
						headerObserver.disconnect();
						watchMenu();
					}
				});
				headerObserver.observe(document.body, { childList: true, subtree: true });
				setTimeout(() => headerObserver.disconnect(), 15_000);
				window.addEventListener('pagehide', () => headerObserver.disconnect(), { once: true });
			}
		});
	</script>
<?php endif;

if (isset($arResult['config']['notify']) && !empty($arResult['config']['notify']))
{
	Extension::load(['intranet.license-notify', 'ui.banner-dispatcher']);
	?>
	<script>
		BX.ready(() => {
			BX.message(<?= Web\Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
			const manager = new BX.Intranet.LicenseNotify(<?= \CUtil::PhpToJSObject($arResult['config']) ?>);
			manager.getProvider().show();
		});
	</script>
	<?php
}
if (isset($arResult['annualSummary'])):
	Extension::load(['ui.banner-dispatcher', 'intranet.notify-banner.annual-summary']);
?>
	<script>
		const features = <?= Web\Json::encode($arResult['annualSummary']['features'])?>;
		const options = <?= Web\Json::encode($arResult['annualSummary']['options'])?>;
		const annualSummary = new BX.Intranet.NotifyBanner.AnnualSummary(features, options);
		BX.UI.BannerDispatcher.high.toQueue(async (onDone) => {
			annualSummary.subscribe('onClose', onDone);
			annualSummary.subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
			annualSummary.show();
		});
	</script>
<?php endif; ?>
<?php if ($arResult['FEATURE']['PROMOTER'] !== '' || $arResult['FEATURE']['ID'] !== ''): ?>
	<script>
		BX.ready(() => {
			const paramsToRemove = [
				'feature_promoter',
				'feature_promoter_by_id',
			];
			if (window.history && window.history.replaceState)
			{
				const url = new URL(window.location.href);
				paramsToRemove.forEach(param => url.searchParams.delete(param));
				window.history.replaceState(null, '', url.toString());
			}

			let promoter;

			BX.loadExt(['ui.info-helper', 'ui.banner-dispatcher']).then(function() {
				<?php if ($arResult['FEATURE']['ID'] !== ''): ?>
					promoter = BX.UI.FeaturePromotersRegistry.getPromoter({featureId: '<?= \CUtil::JSEscape($arResult['FEATURE']['ID']) ?>'});
				<?php else: ?>
					promoter = BX.UI.FeaturePromotersRegistry.getPromoter({code: '<?= \CUtil::JSEscape($arResult['FEATURE']['PROMOTER']) ?>'});
				<?php endif; ?>
				BX.UI.BannerDispatcher.normal.toQueue((onDone) => {
					BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', () => {
						onDone();
					});

					promoter.show();
				});
			});
		});
	</script>
<?php endif; ?>

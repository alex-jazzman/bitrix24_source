<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Landing\Help;
use \Bitrix\Landing\Manager;
use \Bitrix\Main\Localization\Loc;

/** @var \LandingSiteMasterComponent $component */
/** @var array $arResult */

$siteId = $arResult['SITE']['ID'];

if (\Bitrix\Main\Loader::includeModule('pull'))
{
	\CPullWatch::add(Manager::getUserId(), 'CRM_ENTITY_ORDER');
	\CPullWatch::add(Manager::getUserId(), 'LANDING_ENTITY_LANDING');
}

$hasViews = $component->siteHasViewsAction($siteId);
$hasOrders = $component->siteHasOrdersAction($siteId);
$statusDone = Loc::getMessage('LANDING_TPL_STEP3_STATUS_DONE');
$statusWaiting = Loc::getMessage('LANDING_TPL_STEP3_STATUS_WAITING');
?>
<ul class="landing-sm-content-page-list" role="list" data-testid="landing-master-tasks">
	<li class="landing-sm-content-page landing-sm-content-page--hover<?= $hasViews ? ' landing-sm-content-page--check' : '';?>" role="listitem" data-method="siteHasViews" data-role="landing-sm-phone-qr" data-testid="landing-master-task-item">
		<div class="landing-sm-content-page-title"><?= Loc::getMessage('LANDING_TPL_SHOW_SHOP');?></div>
		<div class="landing-sm-content-page-edit landing-sm-content-page-edit--text"><?= Loc::getMessage('LANDING_TPL_ORDER_CAMERA');?></div>
		<div class="landing-sm-content-page-status" data-landing-master-card-status data-testid="landing-master-task-status"><?= $hasViews ? $statusDone : $statusWaiting;?></div>
	</li>
	<li class="landing-sm-content-page <?= $hasOrders ? ' landing-sm-content-page--check' : '';?>" role="listitem" data-method="siteHasOrders" data-role="landing-sm-shop-page-step-4" data-testid="landing-master-task-item">
		<div class="landing-sm-content-page-title"><?= Loc::getMessage('LANDING_TPL_FIRST_ORDER');?></div>
		<div class="landing-sm-content-page-edit landing-sm-content-page-edit--text"><?= Loc::getMessage('LANDING_TPL_ORDER_CREATE');?></div>
		<div class="landing-sm-content-page-status" data-landing-master-card-status data-testid="landing-master-task-status"><?= $hasOrders ? $statusDone : $statusWaiting;?></div>
	</li>
</ul>
<?php if (Manager::getZone() === 'by'):?>
	<div class="landing-sm-content-text landing-sm-content-text--italic">
		<?= Loc::getMessage('LANDING_TPL_FIRST_ORDER_REQUIREMENTS', [
			'#LINK_HELP1#' => '<a href="' . Help::getHelpUrl('FIRST_ORDER_REQUIREMENTS') . '" data-testid="landing-master-help-link">',
			'#LINK_HELP2#' => '</a>'
		])?>
	</div>
<?php endif;?>
<?php if (Manager::getZone() === 'ru'):?>
	<div class="landing-sm-content-text landing-sm-content-text--italic">
		<?= Loc::getMessage('LANDING_TPL_FIRST_ORDER_STEPS_1', [
			'#LINK_HELP1#' => '<a href="' . Help::getHelpUrl('FREE_MESSAGES') . '" data-testid="landing-master-help-link">',
			'#LINK_HELP2#' => '</a>'
		])?>
	</div>
	<div class="landing-sm-content-text landing-sm-content-text--italic">
		<?= Loc::getMessage('LANDING_TPL_FIRST_ORDER_STEPS_2')?>
	</div>
<?php endif;?>
<script>
	BX.ready(function() {

		// without the module of accessibility the step keeps working, only silently
		var a11y = BX.Reflection.getClass('BX.Landing.Component.siteMasterA11y') || {
			announce: function() {},
			endChange: function() {}
		};
		var statusDone = '<?= \CUtil::jsEscape($statusDone);?>';
		var doneMessages = {
			siteHasViews: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_STEP3_SHOP_VIEWED'));?>',
			siteHasOrders: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_STEP3_ORDER_CREATED'));?>'
		};
		var nextReadyMessage = '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_STEP3_NEXT_READY'));?>';

		function adjustFinalStyle()
		{
			var steps = document.querySelectorAll('.landing-sm-content-page');
			var checkedSteps = document.querySelectorAll('.landing-sm-content-page--check');
			if(steps.length === checkedSteps.length) {
				var buttonNextStep = document.getElementById('landing-master-next');
				BX.addClass(buttonNextStep, 'ui-btn-success');
				BX.removeClass(buttonNextStep, 'ui-btn-light-border');
				checkStepImage(document.querySelector('[data-index="landing-sm-shop-page-step-5"]'));

				// the colour of the button is the whole message of the readiness, and colour is not read
				a11y.announce(nextReadyMessage);
			}
		}

		function checkStepImage(itemNode)
		{
			var currentCheckImage = document.querySelector('.landing-sm-phone-pic-item--show');
			if(currentCheckImage)
			{
				BX.removeClass(currentCheckImage, 'landing-sm-phone-pic-item--show');
			}
			BX.addClass(itemNode, 'landing-sm-phone-pic-item--show');
		}

		function selectStepItem(itemNode)
		{
			var currentSelectItem = document.querySelector('.landing-sm-content-page--hover');
			if(currentSelectItem)
			{
				BX.removeClass(currentSelectItem, 'landing-sm-content-page--hover');
			}
			BX.addClass(itemNode, 'landing-sm-content-page--hover');
		}

		function checkStepItem(itemNode)
		{
			BX.addClass(itemNode, 'landing-sm-content-page--check');

			// the tick in the corner marks a done card by colour alone; the status text says the same
			var status = itemNode.querySelector('[data-landing-master-card-status]');
			if (status)
			{
				status.textContent = statusDone;
			}
		}

		function pushReaction(action)
		{
			// every event of the portal is a change of its own: without the boundary a repeated status
			// would be suppressed as a duplicate and never voiced again
			a11y.endChange();

			var item = document.querySelector('[data-method="' + action + '"]');
			if (item)
			{
				checkStepItem(item);
				a11y.announce(doneMessages[action]);
				checkStepImage(document.querySelector('[data-index="' + item.getAttribute('data-role') + '"]'));
				BX.removeClass(item, 'landing-sm-content-page--hover');

				var otherItemId = (action === 'siteHasOrders')
					? 'siteHasViews'
					: 'siteHasOrders';

				var otherItem = document.querySelector('[data-method="' + otherItemId +'"]');
				if(otherItemId === 'siteHasOrders')
				{
					selectStepItem(otherItem);
					checkStepImage(document.querySelector('[data-index="' + otherItem.getAttribute('data-role') + '"]'));
				}
			}
			adjustFinalStyle();
		}

		top.BX.addCustomEvent('onPullEvent', function(module, command, params)
		{
			if (module !== 'crm' && module !== 'landing')
			{
				return;
			}
			if (command === 'onOrderSave' || command === 'onLandingFirstView')
			{
				var action = (command === 'onOrderSave')
					? 'siteHasOrders'
					: 'siteHasViews';
				if (command === 'onLandingFirstView')
				{
					pushReaction(action);
					return;
				}
				BX.ajax.runComponentAction('bitrix:landing.site_master',
					action,
					{
						mode: 'class',
						data: { siteId: <?= $siteId;?> }
					})
					.then(function(response) {
						if (response.data === true)
						{
							pushReaction(action);
						}
					})
			}
		});
	});
</script>
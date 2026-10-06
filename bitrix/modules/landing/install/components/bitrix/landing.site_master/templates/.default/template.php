<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var \CMain $APPLICATION */
/** @var \LandingSiteMasterComponent $component */
/** @var array $arResult */
/** @var array $arParams */

use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$bodyClass = $APPLICATION->getPageProperty('BodyClass');
$APPLICATION->setPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-background');

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.forms',
	'ui.tilegrid',
	'loader',
	'sidepanel',
	'main.qrcode',
	'ui.confetti',
	'ui.a11y',
	'landing.ui.a11y',
]);

if ($arResult['ERRORS'])
{
	?><div class="landing-message-label error" id="landing-master-errors" tabindex="-1" data-testid="landing-master-errors"><?
	foreach ($arResult['ERRORS'] as $error)
	{
		echo htmlspecialcharsbx($error) . '<br/>';
	}
	?></div><?
}
if ($arResult['FATAL'])
{
	return;
}

$step = $arResult['STEP'];
$site = $arResult['SITE'];
$siteId = $arResult['SITE']['ID'];
$stepMax = 4;
$step = max(0, min($step, $stepMax));
?>

<?if ($step != 4):?>
<div class="landing-sm" data-testid="landing-master">
	<div class="landing-sm-wrapper">
		<div class="landing-sm-head">
			<div class="landing-sm-head-logo"></div>
			<div class="landing-sm-head-container">
				<h1 class="landing-sm-head-title"><?= Loc::getMessage('LANDING_TPL_HEAD_TITLE');?></h1>
				<div class="landing-sm-head-title landing-sm-head-title--sub"><?= Loc::getMessage('LANDING_TPL_WORKING_ALREADY');?></div>
			</div>
		</div>
		<form method="get" action="<?= POST_FORM_ACTION_URI;?>" data-testid="landing-master-form">
		<input type="hidden" name="IFRAME" value="<?= $component->request('IFRAME') == 'Y' ? 'Y' : 'N';?>" />
		<?= bitrix_sessid_post();?>
		<div class="landing-sm-container">
			<ol class="landing-sm-steps" role="list" data-testid="landing-master-steps">
				<?for ($i = 1; $i <= 3; $i++):?>
				<li class="landing-sm-steps-item<?= ($i == $arResult['STEP']) ? ' landing-sm-steps-item--active' : '';?>"<?= ($i == $arResult['STEP']) ? ' aria-current="step"' : '';?> data-testid="landing-master-step-item">
					<span class="landing-visually-hidden"><?= Loc::getMessage('LANDING_TPL_STEP_POSITION', ['#NUMBER#' => $i, '#TOTAL#' => 3]);?></span>
					<?= Loc::getMessage('LANDING_TPL_STEP' . $i . '_TITLE');?>
				</li>
				<?endfor;?>
			</ol>
			<div class="landing-sm-content" data-testid="landing-master-content">
				<h2 class="landing-sm-content-title" id="landing-master-step-title" tabindex="-1" data-testid="landing-master-step-title"><?= Loc::getMessage('LANDING_TPL_STEP' . $step . '_DESC');?></h2>
				<div class="landing-sm-content-wrapper">
					<?include 'steps/step' . $step . '.php';?>
				</div>
				<div class="landing-sm-content-bottom">
					<?if ($step > 1 && $step < $stepMax):?>
						<button type="submit" name="STEP" value="<?= $step - 1;?>" id="landing-master-prev" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round" data-testid="landing-master-prev-btn">
							<?= Loc::getMessage('LANDING_TPL_FORM_PREV_STEP');?>
						</button>
					<?endif;?>
					<?if ($step < $stepMax):?>
						<button type="submit" name="STEP" value="<?= $step + 1;?>" id="landing-master-next" class="ui-btn ui-btn-lg<?if ($step === 1):?> ui-btn-success<?else:?> ui-btn-light-border<?endif;?> ui-btn-round"<?if ($step === 1):?> style="min-width: 330px;"<?endif;?> data-testid="landing-master-next-btn">
							<?= Loc::getMessage('LANDING_TPL_FORM_NEXT_STEP');?>
						</button>
					<?else:?>
						<a href="<?= SITE_DIR;?>crm/deal/" target="_top" class="ui-btn ui-btn-lg ui-btn-success ui-btn-round" data-testid="landing-master-complete-link">
							<?= Loc::getMessage('LANDING_TPL_FORM_COMPLETE');?>
						</a>
					<?endif;?>
				</div>
			</div>
		</div>
		</form>
	</div>
	<div class="landing-sm-phone-wrapper">
		<div class="landing-sm-phone">
			<?$lang = in_array(LANGUAGE_ID, ['ru', 'kz']) ? 'ru' : 'en';?>
			<?if ($step != 3):?>
				<div class="landing-sm-phone-pic">
				<?if ($step === 1):?>
					<img class="landing-sm-phone-pic-item landing-sm-phone-pic-item--show" src="<?= $component->getComponentTemplate();?>/image/<?=$lang?>/landing-sm-shop-page-7.webp" alt="">
				<?elseif ($step === 2):?>
					<img class="landing-sm-phone-pic-item landing-sm-phone-pic-item--show" src="<?= $component->getComponentTemplate();?>/image/<?=$lang?>/landing-sm-shop-page-8.webp" alt="">
				<?endif;?>
			</div>
			<?else:?>
			<?php $siteUrl = $component->getPageParam($site['SITE_URL'], ['promo' => 'Y']);?>
			<div class="landing-sm-phone-pic">
				<img class="landing-sm-phone-pic-item" src="<?= $component->getComponentTemplate();?>/image/<?=$lang?>/landing-sm-shop-page-4.webp" alt="" data-index="landing-sm-shop-page-step-4">
				<img class="landing-sm-phone-pic-item" src="<?= $component->getComponentTemplate();?>/image/<?=$lang?>/landing-sm-shop-page-5.webp" alt="" data-index="landing-sm-shop-page-step-5">
				<div class="landing-sm-phone-qr landing-sm-phone-pic-item landing-sm-phone-pic-item--show" data-index="landing-sm-phone-qr">
					<div class="landing-sm-phone-qr-top"><?= Loc::getMessage('LANDING_TPL_QRCODE_CAMERA');?></div>
					<div class="landing-sm-phone-qr-code" id="landing-master-qrcode" data-testid="landing-master-qrcode"></div>
					<div class="landing-sm-phone-qr-address-label"><?= Loc::getMessage('LANDING_TPL_QRCODE_ADDRESS');?></div>
					<a class="landing-sm-phone-qr-address" href="<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeHrefScheme($siteUrl));?>" target="_blank" rel="noopener" data-testid="landing-master-qr-address-link"><?= htmlspecialcharsbx($siteUrl);?></a>
					<?if ($helpUrl = \Bitrix\Landing\Help::getHelpUrl('QRCODE')):?>
						<a class="landing-sm-phone-qr-link" href="<?= $helpUrl;?>" data-testid="landing-master-qr-help-link"><?= Loc::getMessage('LANDING_TPL_QRCODE_HOW_SCAN');?></a>
					<?endif;?>
					<div class="landing-sm-phone-qr-bx-logo<?if($lang === 'ru'):?> landing-sm-phone-qr-bx-logo--ru<?endif;?>"></div>
					<div class="landing-sm-phone-qr-bx-logo-text"><?= Loc::getMessage('LANDING_TPL_QRCODE_COPY');?></div>
					<script>
						BX.ready(function()
						{
							new QRCode(BX('landing-master-qrcode'), {
								text: '<?= \CUtil::jsEscape($siteUrl);?>',
								width: 250,
								height: 250
							});
						});
					</script>
				</div>
			</div>
			<?endif;?>
		</div>
	</div>
	<div class="landing-sm-bg"></div>
</div>
<?else:?>
<div class="landing-sm-teaser<?if (!\Bitrix\Landing\Manager::availableOnlyForZone('ru')){?> landing-sm-teaser--en<?}?>" id="landing-sm-teaser-confetti" data-testid="landing-master-teaser">
	<div class="landing-sm-teaser-head">
		<h1 class="landing-sm-teaser-title" id="landing-master-step-title" tabindex="-1" data-testid="landing-master-step-title"><?= Loc::getMessage('LANDING_TPL_CONGRATULATIONS');?></h1>
		<div class="landing-sm-teaser-title landing-sm-teaser-title--sub"><?= Loc::getMessage('LANDING_TPL_READY_FOR_CLIENTS');?></div>
		<div class="landing-sm-teaser-control">
			<div class="landing-sm-teaser-button">
				<?php if ($component->siteHasOrdersAction($siteId)): ?>
					<?php if (\CCrmSaleHelper::isWithOrdersMode()): ?>
					<a href="<?= SITE_DIR;?>shop/orders/" data-crm-shop-teaser-button="Y" target="_top" class="ui-btn ui-btn-lg ui-btn-success" data-testid="landing-master-finish-link">
						<?= Loc::getMessage('LANDING_TPL_FORM_COMPLETE_ORDER');?>
					</a>
					<?php else: ?>
					<a href="<?= SITE_DIR;?>crm/deal/?redirect_to" data-crm-shop-teaser-button="Y" target="_top" class="ui-btn ui-btn-lg ui-btn-success" data-testid="landing-master-finish-link">
						<?= Loc::getMessage('LANDING_TPL_FORM_COMPLETE_DEAL');?>
					</a>
					<?php endif;?>
				<?php else: ?>
					<a href="<?= SITE_DIR;?>shop/stores/" data-crm-shop-teaser-button="Y" target="_top" class="ui-btn ui-btn-lg ui-btn-success" data-testid="landing-master-finish-link">
						<?= Loc::getMessage('LANDING_TPL_FORM_COMPLETE_SHOP');?>
					</a>
				<?php endif ?>
			</div>
		</div>
	</div>
	<div class="landing-sm-teaser-bottom"></div>
</div>
<script>
	BX.ready(function() {
		var crmShopTeaserButtons = document.querySelectorAll('[data-crm-shop-teaser-button="Y"]');
		for (var i = 0; i < crmShopTeaserButtons.length; i++)
		{
			crmShopTeaserButtons[i].addEventListener(
				'click',
				function (event) {
					localStorage.setItem('crmShopMasterJustFinished', 'Y');
				}
			);
		}

		// the confetti is drawn by a script on a canvas of its own, so only the script can hold it back
		var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion)
		{
			return;
		}

		setTimeout(function() {
			BX.UI.Confetti.fire({
				particleCount: 240,
				spread: 170,
				origin: { y: 0.2 }
			});
		}, 2000);
	});
</script>
<?endif;?>

<script>
	BX.ready(function() {
		var buttonNext = document.getElementById('landing-master-next');
		var form = buttonNext ? buttonNext.form : null;

		if (!form)
		{
			return;
		}

		form.addEventListener('submit', function(event) {
			if (event.defaultPrevented)
			{
				return;
			}

			var slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider)
			{
				slider.showLoader();
			}
		});
	});
</script>

<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

use \Bitrix\Landing\Hook\Page\Cookies;
use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\Web\Json;

Loc::loadMessages(__FILE__);
\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.link',
	'ui.switcher',
	'ui.a11y',
]);

$colorBg = Cookies::sanitizeColor('COLOR_BG', $arParams['COLOR_BG']);
$colorText = Cookies::sanitizeColor('COLOR_TEXT', $arParams['COLOR_TEXT']);

// The visible label of the notice and the label placed into its accessible name are one and the
// same value: the name of a control has to carry what is written on it (WCAG 2.5.3), and a name
// translated apart from the label would stop carrying it in every language but this one.
$noticeLabel = 'Cookies';
?>

<?if ($arParams['USE'] == 'Y'):?>
	<div class="bx-landing-cookies-popup" id="bx-landing-cookies-popup"
		role="dialog" aria-modal="true" aria-labelledby="bx-landing-cookies-popup-title">
		<h2 class="bx-landing-cookies-popup-title" id="bx-landing-cookies-popup-title"><?= Loc::getMessage('LANDING_TPL_COOKIES_HEADER');?></h2>
		<div class="bx-landing-cookies-popup-content">
			<div class="bx-landing-cookies-main-agreement"></div>
			<h3 class="bx-landing-cookies-popup-subtitle"><?= Loc::getMessage('LANDING_TPL_COOKIES_AGREEMENTS_HEADER');?></h3>
			<div class="bx-landing-cookies-popup-subtitle-detail"><?= Loc::getMessage('LANDING_TPL_COOKIES_AGREEMENTS_LABEL');?></div>

			<div>
				<div class="bx-landing-cookies-main-agreement-block">
					<h4 class="bx-landing-cookies-main-agreement-block-name"
						id="bx-landing-cookies-analytic-title"><?= Loc::getMessage('LANDING_TPL_COOKIES_ANALYTIC_AGREEMENTS');?></h4>
					<button type="button" class="bx-landing-cookies-switcher"
						id="bx-landing-cookies-analytic-switcher" data-type="analytic" data-state="false"
						aria-labelledby="bx-landing-cookies-analytic-switcher bx-landing-cookies-analytic-title"><?= Loc::getMessage('LANDING_TPL_COOKIES_SWITCHER_OFF');?></button>
				</div>
				<div class="bx-landing-cookies-analytic-agreements"></div>
			</div>

			<div>
				<div class="bx-landing-cookies-main-agreement-block">
					<h4 class="bx-landing-cookies-main-agreement-block-name"><?= Loc::getMessage('LANDING_TPL_COOKIES_TECHNICAL_AGREEMENTS');?></h4>
				</div>
				<div class="bx-landing-cookies-technical-agreements" data-type="technical"></div>
			</div>

			<div>
				<div class="bx-landing-cookies-main-agreement-block">
					<h4 class="bx-landing-cookies-main-agreement-block-name"><?= Loc::getMessage('LANDING_TPL_COOKIES_OTHER_AGREEMENTS');?></h4>
				</div>
				<div class="bx-landing-cookies-other-agreements" data-type="other"></div>
			</div>

		</div>
		<div class="bx-landing-cookies-popup-footer">
			<button type="button" class="ui-btn ui-btn-lg ui-btn-primary ui-btn-round bx-landing-cookies-button-save">
				<?= Loc::getMessage(($arParams['INFORMATION'] == 'Y') ? 'LANDING_TPL_COOKIES_UNDERSTAND' : 'LANDING_TPL_COOKIES_ACCEPT');?>
			</button>
			<button type="button" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round bx-landing-cookies-button-cancel"<?if ($arParams['INFORMATION'] == 'Y') {?> style="display: none;" <?}?>>
				<?= Loc::getMessage('LANDING_TPL_COOKIES_DECLINE');?>
			</button>
		</div>
		<button type="button" class="bx-landing-cookies-button-close"
			aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_COOKIES_CLOSE_ARIA_LABEL'));?>"></button>
	</div>
	<div class="bx-landing-cookies-popup-warning" id="bx-landing-cookies-popup-warning"
		role="region" aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_COOKIES_BAR_ARIA_LABEL'));?>">
		<div class="bx-landing-cookies-popup-warning-inner">
			<div class="bx-landing-cookies-popup-warning-left">
				<span class="bx-landing-cookies-popup-warning-text"><?= $arResult['AGREEMENT']['LABEL_TEXT'];?></span>
				<button type="button" class="bx-landing-cookies-popup-warning-link" id="bx-landing-cookies-opt-link"><?= Loc::getMessage('LANDING_TPL_COOKIES_DETAIL_LINK');?></button>
			</div>
			<div class="bx-landing-cookies-popup-warning-right">
				<button type="button" class="ui-btn ui-btn-lg ui-btn-primary ui-btn-round" id="bx-landing-cookies-accept">
					<?= Loc::getMessage(($arParams['INFORMATION'] == 'Y') ? 'LANDING_TPL_COOKIES_UNDERSTAND' : 'LANDING_TPL_COOKIES_ACCEPT');?>
				</button>
				<button type="button" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round bx-landing-cookies-button-cancel bx-landing-cookies-button-cancel-second"<?if ($arParams['INFORMATION'] == 'Y') {?> style="display: none;" <?}?>>
					<?= Loc::getMessage('LANDING_TPL_COOKIES_DECLINE');?>
				</button>
				<button type="button" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round" id="bx-landing-cookies-opt">
					<?= Loc::getMessage(($arParams['INFORMATION'] == 'Y') ? 'LANDING_TPL_COOKIES_DETAIL' : 'LANDING_TPL_COOKIES_OPT');?>
				</button>
			</div>
		</div>
	</div>
	<button type="button" aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_COOKIES_NOTICE_ARIA_LABEL', ['#LABEL#' => $noticeLabel]));?>"
		class="bx-landing-cookies-popup-notice" id="bx-landing-cookies-popup-notice"
		 style="<?= ($arParams['POSITION'] == 'bottom_right') ? 'right: 15px;' : 'left: 75px; bottom: 23px;';?>
				 background:<?= $colorBg;?>;
				 color:<?= $colorText;?>;">
		<span class="bx-landing-cookies-popup-notice-svg-wrap">
			<svg style="fill:<?= $colorText;?>;" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="#FFF" class="bx-landing-cookies-popup-notice-svg" aria-hidden="true">
				<path fill-rule="evenodd" d="M7.328.07c.463 0 .917.043 1.356.125.21.04.3.289.228.49a1.5 1.5 0 001.27 1.99h.001a.22.22 0 01.213.243 3.218 3.218 0 003.837 3.453c.18-.035.365.078.384.26A7.328 7.328 0 117.329.07zm.263 10.054a1.427 1.427 0 100 2.854 1.427 1.427 0 000-2.854zM3.697 7.792a.884.884 0 100 1.769.884.884 0 000-1.769zm5.476-.488a.884.884 0 100 1.768.884.884 0 000-1.768zM5.806 3.628a1.427 1.427 0 100 2.854 1.427 1.427 0 000-2.854z"></path>
			</svg>
		</span>
		<span class="bx-landing-cookies-popup-notice-text-wrap">
			<span class="bx-landing-cookies-popup-notice-text"><?= htmlspecialcharsbx($noticeLabel);?></span>
		</span>

	</button>
<?endif;?>

<?if ($arParams['INFORMATION'] == 'Y'):?>
<style>
	.bx-landing-cookies-popup-content .ui-switcher,
	.bx-landing-cookies-popup-content .bx-landing-cookies-switcher {
		display: none;
	}
</style>
<?endif;?>

<script>
	// don't use BX.ready here
	window.addEventListener('load', function()
	{
		new BX.Landing.Cookies({
			enable: <?= $arParams['USE'] == 'Y' ? 'true' : 'false';?>,
			siteId: <?= $arParams['SITE_ID'];?>,
			onlyInformation: <?= ($arParams['INFORMATION'] == 'Y') ? 'true' : 'false';?>,
			availableCodes: <?= Json::encode($arResult['AVAILABLE_AGREEMENTS']);?>,
			idButtonOpt: 'bx-landing-cookies-opt',
			idButtonOptLink: 'bx-landing-cookies-opt-link',
			idButtonAccept: 'bx-landing-cookies-accept',
			idAgreementPopup: 'bx-landing-cookies-popup',
			idAgreementSmallPopup: 'bx-landing-cookies-popup-warning',
			idCookiesNotice: 'bx-landing-cookies-popup-notice',
			classNameMainAgreement: 'bx-landing-cookies-main-agreement',
			classNameAnalyticAgreements: 'bx-landing-cookies-analytic-agreements',
			classNameTechnicalAgreements: 'bx-landing-cookies-technical-agreements',
			classNameOtherAgreements: 'bx-landing-cookies-other-agreements',
			classNameButtonSave: 'bx-landing-cookies-button-save',
			classNameButtonCancel: 'bx-landing-cookies-button-cancel',
			classNameButtonClose: 'bx-landing-cookies-button-close',
			classNameCookiesSwitcher: 'bx-landing-cookies-switcher',
			agreementAjaxPath: '/bitrix/services/main/ajax.php',
			messages: {
				acceptAll: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_ACCEPT'))?>',
				acceptModified: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_ACCEPT_MODIFIED'))?>',
				declineAll: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_DECLINE'))?>',
				declineModified: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_DECLINE_MODIFIED'))?>',
				switcherOn: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_SWITCHER_ON'))?>',
				switcherOff: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_SWITCHER_OFF'))?>',
				agreementsReady: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_AGREEMENTS_READY'))?>',
				agreementsError: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_COOKIES_AGREEMENTS_ERROR'))?>'
			}
		});
	});
</script>

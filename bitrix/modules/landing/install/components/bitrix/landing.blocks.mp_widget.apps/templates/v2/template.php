<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Extension::load([
	'ui.qrauthorization',
	// the focus ring of the stylesheet is built from the tokens of this one
	'ui.design-tokens.air',
	'ui.icon-set.main',
	'ui.icon-set.social',
	'ui.buttons',
]);

Loc::loadMessages(__FILE__);

$mobileText = Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_TEXT_1');
$mobileButtonText = htmlspecialcharsbx(Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_BUTTON_TEXT'));
$mobileIdBase = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
$mobileIdMain = $mobileIdBase . '-main';
$mobileIdSidebar = $mobileIdBase . '-sidebar';

$desktopText = Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_DESKTOP_TEXT_1', [
	'#OS_NAME#' => $arResult['OS_NAME'],
]);
$desktopButtonText = Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_DESKTOP_BUTTON_TEXT');
$buttonLink = htmlspecialcharsbx((string)$arResult['DESKTOP_APP_LINK']);
$os = $arResult['OS'];
$osIconClass = '';
if ($os === 'MAC')
{
	$osIconClass = '--apple-and-ios';
}
if ($os === 'WIN')
{
	$osIconClass = '--windows';
}
if ($os === 'LIN')
{
	$osIconClass = '--linux';
}
$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
?>
<div class="landing-widget-apps-v2" id="<?= $id ?>" data-testid="mainpage-widget-apps-v2-root">
	<div class="landing-widget-view-main">
		<div class="landing-widget-content">
			<div class="landing-widget-app-v2-mobile" id="<?= $mobileIdMain ?>">
				<div class="landing-widget-app-v2-mobile-logo-container">
					<div class="landing-widget-app-v2-mobile-logo"></div>
				</div>
				<h2 class="landing-widget-app-v2-mobile-title">
					<?= \htmlspecialcharsbx($arResult['TITLE_MOBILE']) ?>
				</h2>
				<div class="landing-widget-app-v2-mobile-text-box">
					<div class="landing-widget-app-v2-mobile-text">
						<?= $mobileText ?>
					</div>
				</div>
				<div class="landing-widget-app-v2-mobile-inner">
					<div class="landing-widget-app-v2-mobile-qr-wrap">
						<div class="landing-widget-app-v2-mobile-qr-box">
							<div class="ui-icon-set --qr-code-1 landing-widget-app-v2-mobile-qr-icon"></div>
						</div>
					</div>
					<div class="landing-widget-app-v2-mobile-qr-control-box">
						<button
							type="button"
							class="landing-widget-qr-button"
							data-testid="mainpage-widget-apps-v2-qr-btn"
						>
							<?= $mobileButtonText ?>
						</button>
					</div>
				</div>
			</div>
			<div class="landing-widget-app-v2-desktop">
				<div class="landing-widget-app-v2-desktop-logo-container">
					<div class="landing-widget-app-v2-desktop-logo"></div>
				</div>
				<h2 class="landing-widget-app-v2-desktop-title">
					<?= \htmlspecialcharsbx($arResult['TITLE_DESKTOP']) ?>
				</h2>
				<div class="landing-widget-app-v2-desktop-text-box">
					<div class="landing-widget-app-v2-desktop-text">
						<?= $desktopText ?>
					</div>
				</div>
				<div class="landing-widget-app-v2-desktop-inner">
					<div class="landing-widget-app-v2-desktop-icon-wrap">
						<div class="landing-widget-app-v2-desktop-icon-box">
							<div class="ui-icon-set <?= $osIconClass ?> landing-widget-app-v2-desktop-icon"></div>
						</div>
					</div>
					<a
						href="<?= $buttonLink ?>"
						class="landing-widget-desktop-button"
						data-testid="mainpage-widget-apps-v2-desktop-link"
					>
						<?= $desktopButtonText ?>
					</a>
				</div>
			</div>
		</div>
	</div>
	<div class="landing-widget-view-sidebar">
		<div class="landing-widget-content">
			<div class="landing-widget-app-v2-mobile" id="<?= $mobileIdSidebar ?>">
				<div class="landing-widget-app-v2-mobile-logo-container">
					<div class="landing-widget-app-v2-mobile-logo"></div>
				</div>
				<h2 class="landing-widget-app-v2-mobile-title">
					<?= \htmlspecialcharsbx($arResult['TITLE_MOBILE']) ?>
				</h2>
				<div class="landing-widget-app-v2-mobile-content">
					<div class="landing-widget-app-v2-mobile-main">
						<div class="landing-widget-app-v2-mobile-text-box">
							<div class="landing-widget-app-v2-mobile-text">
								<?= $mobileText ?>
							</div>
						</div>
						<div class="landing-widget-app-v2-mobile-inner">
							<div class="landing-widget-app-v2-mobile-qr-wrap">
								<div class="landing-widget-app-v2-mobile-qr-box">
									<div class="ui-icon-set --qr-code-1 landing-widget-app-v2-mobile-qr-icon"></div>
								</div>
							</div>
							<div class="landing-widget-app-v2-mobile-qr-control-box">
								<button
									type="button"
									class="landing-widget-qr-button"
									data-testid="mainpage-widget-apps-v2-qr-btn"
								>
									<?= $mobileButtonText ?>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="landing-widget-app-v2-desktop">
				<div class="landing-widget-app-v2-desktop-logo-container">
					<div class="landing-widget-app-v2-desktop-logo"></div>
				</div>
				<h2 class="landing-widget-app-v2-desktop-title">
					<?= \htmlspecialcharsbx($arResult['TITLE_DESKTOP']) ?>
				</h2>
				<div class="landing-widget-app-v2-desktop-content">
					<div class="landing-widget-app-v2-desktop-main">
						<div class="landing-widget-app-v2-desktop-text-box">
							<div class="landing-widget-app-v2-desktop-text">
								<?= $desktopText ?>
							</div>
						</div>
						<div class="landing-widget-app-v2-desktop-inner">
							<div class="landing-widget-app-v2-desktop-icon-wrap">
								<div class="landing-widget-app-v2-desktop-icon-box">
									<div class="ui-icon-set <?= $osIconClass ?> landing-widget-app-v2-desktop-icon"></div>
								</div>
							</div>
							<a
								href="<?= $buttonLink ?>"
								class="landing-widget-desktop-button"
								data-testid="mainpage-widget-apps-v2-desktop-link"
							>
								<?= $desktopButtonText ?>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<script>
	BX.ready(function() {
		const editModeElement = document.querySelector('main.landing-edit-mode');
		if (!editModeElement)
		{
			const options = {
				title: '<?= Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_QR_POPUP_TITLE') ?>',
				content: '<?= Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_QR_POPUP_TEXT_1') ?>'
					+ '<br><br>'
					+ '<?= Loc::getMessage('BLOCK_MP_WIDGET_APPS_V2_QR_POPUP_TEXT_2') ?>',
			};
			const widgetElement = document.querySelector('#<?= $id ?>');
			if (widgetElement)
			{
				new BX.Landing.Widget.AppsV2(widgetElement, options);
			}
		}
	});
</script>

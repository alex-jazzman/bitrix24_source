<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die;
}

if ($arResult['OLD_OTP_POPUP'] ?? true):
CJSCore::Init(["popup", "ui.fonts.opensans"]);
?>
<div class="bx-otp-info-popup-container" id="otp_mandatory_info" style="display: none">
	<div class="bx-otp-info-popup-content" style="">
		<div class="bx-otp-info-popup-col-left">
			<div class="bx-otp-info-popup-col-left-img"></div>
			<span><?= GetMessage("INTRANET_OTP_PASS")?></span><br/>
			<span><?= GetMessage("INTRANET_OTP_CODE")?></span>
		</div>
		<div class="bx-otp-info-popup-col-right">
			<div class="bx-otp-info-popup-content-title"><?= GetMessage("INTRANET_OTP_MANDATORY_TITLE")?></div>
			<?= GetMessage("INTRANET_OTP_MANDATORY_DESCR")?>
			<?if (intval($arResult["USER"]["OTP_DAYS_LEFT"])):?>
				<?= GetMessage("INTRANET_OTP_MANDATORY_DESCR2", ["#NUM#" => $arResult["USER"]["OTP_DAYS_LEFT"]])?>
			<?endif?>
		</div>
		<div class="clb"></div>
	</div>
	<div class="bx-otp-info-popup-buttons">
		<a class="bx-otp-info-btn big green" href="<?= $arResult["PATH_TO_PROFILE_SECURITY"]?>"><?= GetMessage("INTRANET_OTP_GOTO")?></a>
		<a class="bx-otp-info-btn big transparent" href="javascript:void(0)" onclick="BX.PopupWindowManager.getCurrentPopup().close()"><?= GetMessage("INTRANET_OTP_CLOSE")?></a>
	</div>
</div>

<script>
	BX.ready(function(){
		if (BX("<?= CUtil::JSEscape($arResult["POPUP_NAME"])?>"))
		{
			const otpPopup = BX.PopupWindowManager.create("otpInfoPopup", null, {
				autoHide: false,
				offsetLeft: 20,
				offsetTop: 10,
				overlay : true,
				draggable: {restrict:true},
				closeByEsc: true,
				content: BX("<?= CUtil::JSEscape($arResult["POPUP_NAME"])?>")
			});

			otpPopup.show();
		}
	});
</script>
<?php else: ?>
<script>
	const qrDataProvider = () => {
		return BX.ajax.runAction('intranet.v2.Otp.getConfig', {
			method: 'POST',
			data: {
				signedUserId: '<?= $arResult['pushOtpConfig']['signedUserId']?>',
			},
		});
	};

	const pushOtpPopupProvider = (callback) => {
		return new Promise((resolve, reject) => {
			qrDataProvider().then((response) => {
				const provider = new BX.Intranet.PushOtp.EnablePushOtpProvider({
					...response?.data,
				});

				const popup = provider.full();

				popup.subscribe('onClose', (event) => {
					const context = event.getData()?.context;
					const qrView = context?.getViewByCode('qr');
					if (qrView?.isAppSuccessConnected() === true)
					{
						callback();
					}
				});

				resolve(popup);
			}, reject);
		});
	};

	BX.ready(() => {
		BX.Runtime.loadExtension('intranet.notify-banner.otp-info', 'ui.banner-dispatcher', 'intranet.push-otp.connect-popup')
			.then((exports) => {
				const { BannerFactory, BannerDispatcher } = exports;
				BannerDispatcher.critical.toQueue((onDone) => {
					const popup = new BannerFactory().create(<?= $arResult['pushOtpConfig']['type']?>, {
						endDate: <?= $arResult['pushOtpConfig']['gracePeriod'] ?? 'null' ?>,
						formatEndDate: '<?= \Bitrix\Main\Context::getCurrent()->getCulture()->getDayMonthFormat() ?>',
						settingsUrl: '<?= $arResult['pushOtpConfig']['settingsUrl'] ?>',
						promoteMode: '<?= $arResult['pushOtpConfig']['promoteMode'] ?>',
						pushOtpPopupProvider: pushOtpPopupProvider,
					});
					popup.subscribe('onClose', onDone);
					popup.show();
				});
			});
	});
</script>
<?php endif; ?>
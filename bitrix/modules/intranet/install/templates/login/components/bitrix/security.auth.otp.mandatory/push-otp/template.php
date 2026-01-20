<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die;
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load([
	'intranet.notify-banner.otp-info',
	'intranet.push-otp.connect-popup',
]);
?>
<script>

	const qrDataProvider = () => {
		return new Promise((resolve) => {
			resolve({
				data: <?= Json::encode($arResult['PUSH_OTP_CONFIG'])?>
			});
		});
	};

	const linkProvider = () => {
		return new Promise((resolve) => {
			resolve({
				data: {
					link: '<?= $arResult['DEEPLINK']?>',
				},
			});
		});
	};

	const appConnectingHandler = (params) => {
		let deviceInfo = {};
		if (params?.device)
		{
			deviceInfo = params.device;
		}

		let data = {
			action: 'check_activate',
			secret: params.secret,
			type: 'push',
			sync1: params.code,
			sync2: '',
			signedUserId: params.signedUserId,
			deviceInfo,
		};
		data.sessid = BX.bitrix_sessid();
		data = BX.ajax.prepareData(data);

		return new Promise((resolve, reject) => {
			return BX.ajax({
				'method': 'POST',
				'dataType': 'json',
				'url': '<?= $componentPath?>/ajax.php',
				'data':  data,
				'onsuccess': (response) => resolve(response),
				'onfailure': (response) => reject(response),
			});
		});
	};

	const pushOtpPopupProvider = () => {
		return new Promise((resolve, reject) => {
			qrDataProvider().then((response) => {
				const provider = new BX.Intranet.PushOtp.EnablePushOtpProvider({
					...response?.data,
					linkProvider: linkProvider,
					appConnectingProvider: appConnectingHandler,
				});

				const popup = provider.onlyPushOtp();

				popup.subscribe('onClose', (event) => {
					const context = event.getData()?.context;
					const qrView = context?.getViewByCode('qr');
					if (qrView?.isAppSuccessConnected() === true)
					{
						location.reload();
					}
				});

				resolve(popup);
			}, reject);
		});
	};

	const popup = new BX.Intranet.NotifyBanner.BannerFactory().createForBlockOtp(
		BX.Intranet.NotifyBanner.BannerType.MANDATORY_2FA, {
			signedUserId: '<?= $arResult['SIGNED_USER_ID']?>',
			endDate: <?= $arResult['END_MANDATORY_PERIOD'] ?? time() ?>,
			promoteMode: '<?= $arResult['PROMOTE_MODE'] ?>',
			formatEndDate: '<?= \Bitrix\Main\Context::getCurrent()->getCulture()->getDayMonthFormat() ?>',
			pushOtpPopupProvider: pushOtpPopupProvider,
		});
	popup.show();
</script>

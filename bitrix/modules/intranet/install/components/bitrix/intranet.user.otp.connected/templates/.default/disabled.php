<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var $arResult array
 * @var $arParams array
 */

if (
	!$arResult["OTP"]["USER_HAS_EDIT_RIGHTS"]
	&& (int)\Bitrix\Intranet\CurrentUser::get()->getId() !== (int)$arParams["USER_ID"]
)
{
	return;
}

Extension::load([
	"ui.buttons",
	'ui.design-tokens',
	'intranet.design-tokens',
	'ui.system.typography',
]);
$arJSParams = [
	"signedParameters" => $this->getComponent()->getSignedParameters(),
	"componentName" => $this->getComponent()->getName(),
	"showOtpPopup" => (isset($_GET["otp"]) && $_GET["otp"] == "Y") ? "Y" : "N",
	//"otpRecoveryCodes" => $arResult["IS_OTP_RECOVERY_CODES_ENABLE"] ? "Y" : "N",

	...$arResult["OTP"]["PUSH_OTP_CONFIG"],
	'provideSmsOtp' => $arResult['PROVIDE_SMS_OTP'] === true,
	'isOtpActive' => $arResult["OTP"]["IS_ACTIVE"] === true,
	'isNotPushOtp' => $arResult['OTP']['TYPE'] !== \Bitrix\Security\Mfa\OtpType::Push,
];
?>

<div class="intranet-user-otp-disabled">
	<div class="intranet-user-otp-disabled__body">
		<h2 class="ui-headline --lg --accent"> <?= Loc::getMessage('INTRANET_USER_OTP_DISABLED_TITLE') ?> </h2>
		<p class="ui-text --md"> <?= Loc::getMessage('INTRANET_USER_OTP_DISABLED_DESCRIPTION') ?> </p>
	</div>
	<div class="intranet-user-otp-disabled__footer" id="button-container"></div>
</div>

<script>
	BX.ready(() => {
		BX.Intranet.UserOtpConnected.init(<?= Json::encode($arJSParams)?>);
		const isExist = <?= $arResult['OTP']['IS_EXIST'] ? 'true' : 'false'?>;
		const enableButton = new BX.UI.Button({
			text: "<?= Loc::getMessage('INTRANET_USER_OTP_DISABLED_BUTTON') ?>",
			size: BX.UI.Button.Size.LARGE,
			style: BX.UI.AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				const popupProvider = BX.Intranet.UserOtpConnected.getPopupOtpProvider();
				if (isExist)
				{
					popupProvider.resumeOtpRequest()
						.then(() => BX.SidePanel.Instance.reload());
				}
				else
				{
					const popup = popupProvider.full();
					popup.subscribe('onClose', (event) => {
						const context = event.getData()?.context;
						const qrView = context?.getViewByCode('qr');
						if (qrView?.isAppSuccessConnected() === true)
						{
							BX.SidePanel.Instance.reload()
						}
					});
					popup.show();
				}
			},
			props: {
				'data-testid': 'bx-user-otp-connected-enable-button',
			},
		});

		enableButton.renderTo(BX('button-container'));
	});
</script>
<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

if ($arResult['isMobile'])
{
	\Bitrix\Main\UI\Extension::load([
		'intranet.mobile-popup',
	]);
	?>
	<script>
		let mobilePopupRegistrationPromise = new Promise((resolve) => {
			BX.ready(() => {
				try
				{
					(new BX.Intranet.MobilePopup()).show().then(resolve, () => resolve(true));
				}
				catch
				{
					resolve(true);
				}
			});
		});
	</script>
<?php
}
else
{
?>
	<script>
		let mobilePopupRegistrationPromise = Promise.resolve(true);
		if (BX.browser.IsMobile())
		{
			mobilePopupRegistrationPromise = BX.Runtime.loadExtension('intranet.mobile-popup')
				.then((exports) => (new exports.MobilePopup()).show())
				.catch(() => true)
			;
		}
	</script>
<?php
}

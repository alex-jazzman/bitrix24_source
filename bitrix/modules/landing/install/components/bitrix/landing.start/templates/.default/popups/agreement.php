<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

if (empty($arResult['AGREEMENT']))
{
	return;
}

use \Bitrix\Main\Localization\Loc;

$id = 'landing-agreement-popup';
$pageName = $this->getPageName();
?>

<div id="<?= $id;?>" style="display: none;">
	<div class="<?= $id;?>-content">
		<form method="POST" action="<?= str_replace('IS_AJAX=Y', '', POST_FORM_ACTION_URI);?>" id="<?= $id;?>-form">
			<input type="hidden" name="action" value="accept_agreement" />
			<?= bitrix_sessid_post();?>
			<?php if (($arResult['AGREEMENT_INITIAL_PROMPT'] ?? '') !== ''): ?>
				<input
					type="hidden"
					name="initial_prompt"
					value="<?= htmlspecialcharsbx((string)$arResult['AGREEMENT_INITIAL_PROMPT']);?>"
				/>
			<?php endif; ?>
			<?= $arResult['AGREEMENT']['TEXT'];?>
		</form>
	</div>
</div>

<script>
	var landingAgreementMessageBox = null;
	var landingAgreementPopupParams = {};
	var landingAgreementPopup = function(params)
	{
		landingAgreementPopupParams = params || {};
		if (!landingAgreementMessageBox) {
			landingAgreementMessageBox = new BX.UI.Dialogs.MessageBox({
				title: '<?= \CUtil::jsEscape($arResult['AGREEMENT']['NAME']); ?>',
				message: BX('<?= $id; ?>'),
				useAirDesign: true,
				modal: true,
				cacheable: true,
				maxWidth: 650,
				popupOptions: {
					closeIcon: <?= $pageName === 'landing_view' ? 'false' : 'true' ?>,
					closeByEsc: <?= $pageName === 'landing_view' ? 'false' : 'true' ?>,
					draggable: true,
					focusTrap: true,
					autoHide: false,
				},
				buttons: [
					new BX.UI.Button({
						text: '<?= \CUtil::jsEscape(Loc::getMessage($arResult['AGREEMENT_ACCEPTED'] ? 'LANDING_TPL_ACCEPTED' : 'LANDING_TPL_ACCEPT')); ?>',
						useAirDesign: true,
						style: <?= $arResult['AGREEMENT_ACCEPTED']
							? 'BX.UI.Button.AirStyle.OUTLINE'
							: 'BX.UI.Button.AirStyle.FILLED'
							?>,
						wide: true,
						onclick: () => {
							landingAgreementMessageBox.close();
							<?php if (!$arResult['AGREEMENT_ACCEPTED']): ?>
							landingAgreementPopupParams.success?.();
							BX('<?= $id; ?>-form').submit();
							<?php endif; ?>
						},
					}),
				],
			});

			BX.addClass(
				landingAgreementMessageBox.getPopupWindow().getPopupContainer(),
				'<?= $id; ?>-wrapper',
			);
		}
		landingAgreementMessageBox.show();
	};
	<?php
		$pageIsNeededAgreement = false;
		if ($pageName === 'landing_view' || $pageName === 'ai')
		{
			$pageIsNeededAgreement = true;
		}
	?>
	<?if ($pageIsNeededAgreement && !$arResult['AGREEMENT_ACCEPTED'] && \Bitrix\Landing\Site\Type::isPublicScope()):?>
	landingAgreementPopup();
	<?endif;?>
</script>

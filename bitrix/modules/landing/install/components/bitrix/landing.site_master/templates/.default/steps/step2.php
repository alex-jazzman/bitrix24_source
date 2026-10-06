<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;

/** @var \LandingSiteMasterComponent $component */
/** @var array $arResult */

$productUrl = $component->getProductUrl(
	$arResult['SITE']['ID']
);
?>

<div class="landing-sm-content-step-shop">
	<div class="landing-sm-content-arrow-wrapper">
		<div>
			<div class="landing-sm-content-text landing-sm-content-text--title"><?= Loc::getMessage('LANDING_TPL_DEMO_PRODUCTS_IN_TRADE_CATALOG_TITLE');?></div>
			<div class="landing-sm-content-text"><?= Loc::getMessage('LANDING_TPL_DEMO_PRODUCTS_IN_TRADE_CATALOG');?></div>
		</div>
	</div>
	<div class="landing-sm-content-text-br"></div>
	<div class="landing-sm-content-text" style="margin-bottom: 32px;"><?= Loc::getMessage('LANDING_TPL_DEMO_PRODUCTS_IN_TRADE_CATALOG_LOOK');?></div>
	<a href="<?= \htmlspecialcharsbx($productUrl);?>" data-role="landing-sm-content-demo-products"
		data-landing-master-slider
		target="_blank" class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
		data-testid="landing-master-demo-products-link"
	><?= Loc::getMessage('LANDING_TPL_SHOW_DEMO_PRODUCTS');?></a>
</div>

<script>
	BX.ready(function()
	{
		var buttonShowStore = document.querySelector('[data-role="landing-sm-content-demo-products"]');
		var buttonNextStep = document.getElementById('landing-master-next');
		// without the module of accessibility the step keeps working, only silently
		var a11y = BX.Reflection.getClass('BX.Landing.Component.siteMasterA11y') || {
			announce: function() {},
			endChange: function() {}
		};

		function adjustButtonStyle()
		{
			buttonShowStore.classList.remove('ui-btn-success');
			buttonShowStore.classList.add('ui-btn-light-border');
			buttonNextStep.classList.remove('ui-btn-light-border');
			buttonNextStep.classList.add('ui-btn-success');
			buttonShowStore.removeEventListener('click', adjustButtonStyle);

			// the colour of the buttons is the whole message of the step so far, and colour is not read
			a11y.endChange();
			a11y.announce('<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_STEP2_NEXT_READY'));?>');
		}

		buttonShowStore.addEventListener('click', adjustButtonStyle);
	});
</script>
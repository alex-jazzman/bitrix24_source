<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load('ui.fonts.opensans');

$titleId = $arResult['LOCK_TITLE_ID'];
?>

<div
	class="landing-html-lock landing-html-lock-partner"
	role="group"
	aria-labelledby="<?= $titleId ?>"
	data-testid="landing-blocks-message-locked"
>
	<div class="landing-html-lock-inner">
		<div class="landing-html-lock-title-block">
			<span class="landing-html-lock-title" id="<?= $titleId ?>"><?= $arParams['~HEADER'];?></span>
		</div>
		<div class="landing-html-lock-text-block">
			<div class="landing-html-lock-text"><?= $arParams['~MESSAGE'];?></div>
		</div>
		<?if ($arParams['~BUTTON'] && $arParams['~LINK']):?>
			<a href="<?= $arParams['~LINK'];?>" target="_top" class="ui-btn ui-btn-md ui-btn-primary landing-required-link" data-testid="landing-blocks-message-locked-btn">
				<?= $arParams['~BUTTON'];?>
			</a>
		<?endif;?>
	</div>
</div>
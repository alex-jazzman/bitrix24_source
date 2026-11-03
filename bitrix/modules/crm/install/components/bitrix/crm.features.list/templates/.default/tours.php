<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var $this \CBitrixComponentTemplate */
/** @var CMain $APPLICATION */
/** @var array $arResult*/
/** @var array $arParams*/

$APPLICATION->SetTitle( \Bitrix\Main\Localization\Loc::getMessage('CRM_FEATURE_PAGE_TITLE', [], 'ru'));
include('toolbar.php');
?>

<div class="crm-features-list-item --tour-switcher">
	<div class="crm-features-list-item-value">
		<span data-role="tour-switcher" data-testid="crm-features-tours-switcher" data-checked="<?php if ($arResult['toursEnabled']):?>Y<?php endif?>"></span>
	</div>
	<div class="crm-features-list-item-name">
		<div>
			<?=\Bitrix\Main\Localization\Loc::getMessage('CRM_FEATURE_LIST_SHOW_TOURS', [], 'ru');?>
		</div>
	</div>
	<div class="right-buttons">
		<span class="ui-btn ui-btn-secondary --air" data-role="tour-reset-all" data-testid="crm-features-tours-reset-all-btn"><span class="ui-btn-text"><?=htmlspecialcharsbx(\Bitrix\Main\Localization\Loc::getMessage('CRM_TOUR_LIST_RESET_TOUR_ALL', [], 'ru'))?></span></span>
	</div>
</div>

<div class="crm-features-list" data-testid="crm-features-tours-list">
	<?php foreach ($arResult['tours'] as $category):?>
		<h2 data-testid="crm-features-tours-category-title"><?=htmlspecialcharsbx($category['name'])?></h2>

		<?php foreach ($category['items'] as $tour):?>
			<div class="crm-features-list-item --tour" data-testid="crm-features-tour-item-<?=htmlspecialcharsbx($tour['id'])?>">
				<div class="crm-features-list-item-name">
					<div>
						<?=$tour['name']?>
						<?php if($tour['secretLink'] ?? null):?>
							<span class="crm-features-list-item-copy" data-testid="crm-features-tour-copy-link-<?=htmlspecialcharsbx($tour['id'])?>" data-url="<?=htmlspecialcharsbx($tour['secretLink'])?>" title="<?=htmlspecialcharsbx(\Bitrix\Main\Localization\Loc::getMessage('CRM_TOUR_LIST_COPY_LINK', [], 'ru'))?>"></span>
						<?php endif?>
					</div>
					<div class="crm-features-list-item-description"><?=$tour['description']?></div>
					<div class="crm-features-list-item-id" data-testid="crm-features-tour-id-<?=htmlspecialcharsbx($tour['id'])?>"><?=htmlspecialcharsbx($tour['id'])?></div>
				</div>
				<div class="crm-features-list-item-action">
					<span class="ui-btn ui-btn-sm ui-btn-secondary --air" data-role="tour-reset" data-testid="crm-features-tour-reset-btn-<?=htmlspecialcharsbx($tour['id'])?>" data-tour-id="<?=htmlspecialcharsbx($tour['id'])?>"><span class="ui-btn-text"><?=htmlspecialcharsbx(\Bitrix\Main\Localization\Loc::getMessage('CRM_TOUR_LIST_RESET_TOUR', [], 'ru'))?></span></span>
				</div>
			</div>
		<?php endforeach?>
	<?php endforeach?>
</div>

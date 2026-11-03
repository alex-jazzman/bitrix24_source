<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var $this \CBitrixComponentTemplate */
/** @var CMain $APPLICATION */
/** @var array $arResult*/
/** @var array $arParams*/

include('toolbar.php');
?>

<div class="crm-features-list" data-testid="crm-features-list">
<?php foreach ($arResult['features'] as $category):?>
	<h2 data-testid="crm-features-category-title"><?=htmlspecialcharsbx($category['name'])?></h2>

	<?php foreach ($category['items'] as $feature):?>
	<div class="crm-features-list-item" data-testid="crm-features-item-<?=htmlspecialcharsbx($feature['id'])?>">
		<div class="crm-features-list-item-value">
			<span data-role="feature-switcher" data-testid="crm-features-switcher-<?=htmlspecialcharsbx($feature['id'])?>" data-id="<?=htmlspecialcharsbx($feature['id'])?>" data-checked="<?php if ($feature['enabled']):?>Y<?php endif?>"></span>
		</div>
		<div class="crm-features-list-item-name">
			<div data-testid="crm-features-item-name-<?=htmlspecialcharsbx($feature['id'])?>">
				<?=htmlspecialcharsbx($feature['name'])?>
				<?php if($feature['secretLink'] ?? null):?>
				<span class="crm-features-list-item-copy" data-testid="crm-features-copy-link-<?=htmlspecialcharsbx($feature['id'])?>" data-url="<?=htmlspecialcharsbx($feature['secretLink'])?>" title="<?=htmlspecialcharsbx(\Bitrix\Main\Localization\Loc::getMessage('CRM_FEATURE_LIST_COPY_LINK', [], 'ru'))?>"></span>
				<?php endif?>
			</div>
			<div class="crm-features-list-item-id" data-testid="crm-features-item-id-<?=htmlspecialcharsbx($feature['id'])?>"><?=htmlspecialcharsbx($feature['id'])?></div>

		</div>
	</div>
	<?php endforeach?>
<?php endforeach?>
</div>

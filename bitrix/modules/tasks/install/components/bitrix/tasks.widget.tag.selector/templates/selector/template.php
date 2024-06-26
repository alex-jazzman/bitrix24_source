<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Loc::loadMessages(__FILE__);

$helper = $arResult['HELPER'];

Extension::load(['ui.entity-selector']);
?>

<?php $helper->displayFatals();?>
<?php if(!$helper->checkHasFatals()):?>

	<div id="<?=$helper->getScopeId()?>" class="tasks task-form-field <?=$arParams['DISPLAY']?> <?=(($arParams['READ_ONLY'] ?? null) ? 'readonly' : '')?>" <?php if($arParams['MAX_WIDTH'] > 0):?>style="max-width: <?=$arParams['MAX_WIDTH']?>px"<?php endif?>>

		<?php $helper->displayWarnings();?>

		<span class="js-id-tag-sel-items tasks-h-invisible">
		    <script type="text/html" data-bx-id="tag-sel-item">
			    <?php ob_start();?>
			    <span class="js-id-tag-sel-item js-id-tag-sel-item-{{VALUE}} task-form-field-item {{ITEM_SET_INVISIBLE}}" data-item-value="{{VALUE}}">
					<span class="task-form-field-item-text" class="task-options-destination-text">
						{{DISPLAY}}
					</span>
					<span class="js-id-tag-sel-item-delete task-form-field-item-delete" title="<?=Loc::getMessage('TASKS_COMMON_CANCEL_SELECT')?>"></span>
					<input type="hidden" name="<?=htmlspecialcharsbx($arParams["INPUT_PREFIX"])?>[{{VALUE}}][NAME]" value="{{DISPLAY}}" />
			    </span>
			    <?php $template = trim(ob_get_flush());?>
		    </script>
			<?php
			foreach($arParams['DATA'] as $item)
			{
				print($helper->fillTemplate($template, $item));
			}
			?></span>

	    <span class="task-form-field-controls">
		    <a href="javascript:void(0);" class="js-id-tag-sel-form-control task-form-field-link add">
			    <span class="task-form-field-when-filled"><?=Loc::getMessage('TASKS_COMMON_ADD_MORE')?></span>
			    <span class="task-form-field-when-empty"><?=Loc::getMessage('TASKS_COMMON_ADD')?></span>
		    </a>
	    </span>

		<?php // in case of all items removed, the field should be sent anyway?>
		<input type="hidden" name="<?=htmlspecialcharsbx($arParams["INPUT_PREFIX"])?>[]" value="" />
	</div>

	<?php $helper->initializeExtension();?>

<?php endif?>
<script>
	BX.ready(function() {
		BX.message({
			TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_TITLE: '<?= Loc::getMessage('TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_TITLE') ?>',
			TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_COME_BACK_LATER: '<?= Loc::getMessage('TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_COME_BACK_LATER') ?>',
			TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_TEXT: '<?= \Bitrix\Main\Web\Json::encode(Loc::getMessage('TASKS_WIDGET_TAG_SELECTOR_TAGS_ARE_CONVERTING_TEXT')) ?>',
		});
	});
</script>
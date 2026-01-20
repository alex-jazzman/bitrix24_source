<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;

\Bitrix\Main\UI\Extension::load([
	'ui.forms',
	'ui.dialogs.messagebox',
	'ui.buttons',
	'ui.alerts',
	'ui.layout-form',
]);

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));
?>
<div class="bizproc-storage-field-edit-container" id="bizproc-storage-field-edit-container">
	<form class="bizproc-storage-field-edit" data-role="bizproc-storage-field-edit">
	<div class="bizproc-storage-field-edit-tab bizproc-storage-field-edit-tab-current" data-tab="detail">
		<div class="storage-field-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ?>>
			<div class="bizproc-storage-field-error ui-alert-message" id="bizproc-storage-field-edit-errors">
				<?php if ($hasErrors):
					foreach ($arResult['errors'] as $error):
						echo htmlspecialcharsbx($error->getMessage());
					endforeach;
					return;
				endif;?>
			</div>
			<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
		</div>
			<input
				type="hidden"
				name="id"
				value="<?= (int)$arResult['field']['id'] ?>"
			>
			<input
				type="hidden"
				name="code"
				value="<?= htmlspecialcharsbx($arResult['field']['code']) ?>"
			>
			<input
				type="hidden"
				name="storageId"
				value="<?= (int)$arParams['storageId'] ?>"
			>
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['type']['label']) ?></div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select
							class="ui-ctl-element"
							name="type"
							<?= ($arResult['field']['id'] > 0) ? 'disabled="disabled"' : '' ?>
						>
							<?php foreach($arResult['types'] as $value => $type) :?>
								<option
									value="<?= htmlspecialcharsbx($value) ?>"
									<?= ($arResult['field']['type'] === $value ? 'selected="selected"' : '') ?>
								><?= htmlspecialcharsbx($type) ?></option>
							<?php endforeach;?>
						</select>
					</div>
				</div>
			</div>
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['name']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
							<input
								type="text"
								class="ui-ctl-element"
								name="name"
								value="<?= htmlspecialcharsbx($arResult['field']['name']) ?>"
							>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['code']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
							<input
								type="text"
								class="ui-ctl-element"
								name="code"
								value="<?= htmlspecialcharsbx($arResult['field']['code']) ?>"
								<?= ($arResult['field']['id'] > 0) ? 'disabled="disabled"' : '' ?>
							>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['sort']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
							<input
								type="text"
								class="ui-ctl-element"
								name="sort"
								value="<?= htmlspecialcharsbx($arResult['field']['sort']) ?>"
							>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['description']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textarea ui-ctl-resize-y ui-ctl-w100">
							<textarea
								type="text"
								class="ui-ctl-element"
								name="description"
							><?= htmlspecialcharsbx($arResult['field']['description']) ?></textarea>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content">
						<label class="ui-ctl-checkbox ui-ctl-w100">
							<input
								type="checkbox"
								class="ui-ctl-element"
								name="multiple"
								value="Y"
								<?= $arResult['field']['multiple'] ? 'checked="checked"' : ''?>
								<?= ($arResult['field']['id'] > 0) ? 'disabled="disabled"' : '' ?>
							>
							<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['multiple']['label']) ?></div>
						</label>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-content">
						<label class="ui-ctl-checkbox ui-ctl-w100">
							<input
								type="checkbox"
								class="ui-ctl-element"
								name="mandatory"
								value="Y"
								<?= $arResult['field']['mandatory'] ? 'checked="checked"' : ''?>
							>
							<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['mandatory']['label']) ?></div>
						</label>
					</div>
				</div>
			</div>
	</div>
		<div class="bizproc-storage-field-edit-buttons">
			<?php
			$buttons = [
				[
					'TYPE' => 'save',
					'CAPTION' => $arParams['skipSave']
						? Loc::getMessage('BIZPROC_STORAGE_FIELD_EDIT_ADD_BUTTON')
						: ''
					,
				],
				'cancel'
			];
			if($arResult['field']['id'] > 0)
			{
				$buttons[] = [
					'TYPE' => 'remove',
				];
			}
			$APPLICATION->IncludeComponent(
				'bitrix:ui.button.panel',
				"",
				[
					'BUTTONS' => $buttons,
					'ALIGN' => 'center'
				],
				$this->getComponent()
			);
			?>
		</div>
	</form>
</div>
<script>
	BX.ready(() => {
		BX.message(<?= \Bitrix\Main\Web\Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);

		BX.Bizproc.Component.StorageFieldEdit.Instance = new BX.Bizproc.Component.StorageFieldEdit({
			formName: 'bizproc-storage-field-edit',
			tabContainer: document.querySelector('.bizproc-storage-field-edit-container'),
			errorsContainer: document.getElementById('bizproc-storage-field-edit-errors'),
			skipSave: <?= $arParams['skipSave'] ? 1 : 0 ?>,
		});
	});
</script>

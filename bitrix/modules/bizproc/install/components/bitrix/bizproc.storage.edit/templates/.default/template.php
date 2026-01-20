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

if (!$hasErrors)
{
	if ($arParams['storageId'])
	{
		$items = [
			[
				'NAME' => Loc::getMessage('BIZPROC_STORAGE_EDIT_TAB_EDIT_TITLE') ?? '',
				'ATTRIBUTES' => [
					'onclick' => 'BX.Bizproc.Component.StorageEdit.handleLeftMenuClick(\'detail\');',
					'data-role' => 'tab-detail',
				],
				'ACTIVE' => true,
			],
			[
				'NAME' => Loc::getMessage('BIZPROC_STORAGE_EDIT_TAB_FIELDS_TITLE') ?? '',
				'ATTRIBUTES' => [
					'onclick' => 'BX.Bizproc.Component.StorageEdit.showStorageFieldList(' . (int)$arParams['storageId'] . ');',
					'data-role' => 'tab-fields',
				],
			],
		];

		$APPLICATION->IncludeComponent(
			'bitrix:ui.sidepanel.wrappermenu',
			"",
			[
				'TITLE' => Loc::getMessage('MAIN_FIELD_CONFIG_SETTINGS'),
				'ITEMS' => $items,
			],
			$this->getComponent()
		);
	}
}
?>
<div class="bizproc-storage-edit-container" id="bizproc-storage-edit-container">
	<div class="bizproc-storage-edit-tab bizproc-storage-edit-tab-current" data-tab="detail">
		<div class="user-field-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ?>>
			<div class="main-user-field-error ui-alert-message" id="main-user-field-edit-errors">
				<?php if ($hasErrors):
					foreach ($arResult['errors'] as $error):
						echo htmlspecialcharsbx($error->getMessage());
					endforeach;
					return;
				endif;?>
			</div>
			<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
		</div>
		<form class="bizproc-storage-edit" data-role="bizproc-storage-edit" method="POST">
			<input
				type="hidden"
				name="id"
				value="<?= (int)$arResult['storage']['id'] ?>"
			>
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['title']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
							<input
								type="text"
								class="ui-ctl-element"
								name="title"
								value="<?= htmlspecialcharsbx($arResult['storage']['title']) ?>"
							>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text"><?= htmlspecialcharsbx($arResult['form']['description']['label']) ?></div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
					<textarea
						class="ui-ctl-element"
						name="description"
						data-role="main-user-field-sort"
					><?= htmlspecialcharsbx($arResult['storage']['description']) ?></textarea>
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
								value="<?= htmlspecialcharsbx($arResult['storage']['code']) ?>"
							>
						</div>
					</div>
				</div>
			</div>
			<div class="main-user-field-edit-buttons">
				<?php
				$buttons = [
					[
						'TYPE' => 'save',
					],
					'cancel'
				];
				if($arResult['storage']['id'] > 0)
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
	<div class="bizproc-storage-edit-tab" data-tab="fields">
		Field settings
	</div>
</div>
<script>
	BX.ready(() => {
		BX.message(<?= \Bitrix\Main\Web\Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);

		BX.Bizproc.Component.StorageEdit.Instance = new BX.Bizproc.Component.StorageEdit({
			formName: 'bizproc-storage-edit',
			tabContainer: document.querySelector('.bizproc-storage-edit-container'),
		});
	});
</script>

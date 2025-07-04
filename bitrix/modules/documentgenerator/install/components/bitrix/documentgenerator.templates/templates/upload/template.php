<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CMain $APPLICATION */
/** @var \CBitrixComponentTemplate $this */

use Bitrix\DocumentGenerator\Integration\Bitrix24Manager;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Toolbar\Facade\Toolbar;

$this->IncludeLangFile();

\Bitrix\Main\UI\Extension::load([
	'core',
	'ui.design-tokens',
	'sidepanel',
	'uploader',
	'popup',
	'socnetlogdest',
	'documentpreview',
	'ui.buttons',
	'ui.buttons.icons',
]);

if (\Bitrix\Main\Loader::includeModule('ui'))
{
	Toolbar::deleteFavoriteStar();

	if (Bitrix24Manager::isEnabled())
	{
		$escapedTemplateName = \CUtil::JSEscape($arResult['TEMPLATE']['NAME']);
		$escapedDefaultCode = \CUtil::JSEscape($arResult['params']['defaultCode'] ?? '');

		Toolbar::addButton(
			new \Bitrix\UI\Buttons\Button([
				'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
				'text' => Loc::getMessage('DOCGEN_TEMPLATE_ADD_FEEDBACK'),
				'onclick' => new \Bitrix\UI\Buttons\JsCode(
					"BX.DocumentGenerator.Feedback.open('', '{$escapedTemplateName}', '{$escapedDefaultCode}');",
				),
			]),
		);
	}
}

?>
<div class='docs-template-load-wrap docs-template-load-wrap-slider'><?php

	if (isset($arResult['TEMPLATE']['ID']))
	{
		?><style>
			.docs-template-load-crm, .docs-template-load-buttons, .docs-template-load-user, .docs-template-load-numerator, .docs-template-load-result {
				display: block;
			}

			.docs-template-load-drag {
				display: none;
			}
		</style><?php
	}
	?>
	<div class="docs-template-error-message" id="upload-template-error-message"<?php

	if (!empty($arResult['ERROR']))
	{
	?> style="display: block;"><?= htmlspecialcharsbx($arResult['ERROR']);
	}
	else
	{
		?>><?php
	} ?></div><?php

	if (empty($arResult['ERROR']))
	{
		?>
		<form>
			<input type="file" name="body" id="upload-template-button"/>
			<div class="docs-template-load-drag" id="upload-template-upload-block">
				<div class="docs-template-load-title-inner">
					<span class="docs-template-load-title"><?= Loc::getMessage('DOCGEN_TEMPLATE_ADD_FILE'); ?></span>
					<div class="docs-template-info-message" id="upload-template-progress-message"><?= Loc::getMessage(
							'DOCGEN_TEMPLATE_ADD_PROGRESS'
						); ?></div>
					<div class="docs-template-success-message" id="upload-template-success-message"><?= Loc::getMessage(
							'DOCGEN_TEMPLATE_ADD_SUCCESS'
						); ?></div>
				</div>
				<div style="position: relative;">
					<div class="docs-template-load-drag-zone" id="upload-template-dragndrop-zone">
						<div class="docs-template-load-drag-inner">
							<span class="docs-template-load-drag-text"><?= Loc::getMessage(
									'DOCGEN_TEMPLATE_ADD_DRAG_HERE'
								); ?></span>
						</div>
					</div>
					<div class="docs-template-close-drag-zone" id="upload-template-dragndrop-cancel"></div>
				</div>
				<div class="docs-template-load-notice">
					<span class="docs-template-load-notice-text"><?= Loc::getMessage(
							'DOCGEN_TEMPLATE_ADD_FORMATS'
						); ?></span>
				</div>
			</div>
			<div class="docs-template-load-result" id="upload-template-file-block">
				<div class="docs-template-load-result-inner">
					<div class="docs-template-load-result-preview">
						<div class="docs-template-load-result-img"></div>
						<span class="docs-template-load-result-name" id="upload-template-file-name"><?= $arResult['TEMPLATE']['fileName']
								? htmlspecialcharsbx($arResult['TEMPLATE']['fileName']) : ''; ?></span>
					</div>
					<div class="docs-template-load-result-size" id="upload-template-file-size"><?= $arResult['TEMPLATE']['fileSize']
							? CFile::FormatSize($arResult['TEMPLATE']['fileSize']) : '' ?></div><?php
					if (!empty($arResult['params']['defaultCode']))
					{
						?>
						<div class="docs-template-load-result-default">
						<span class="docs-template-load-result-default-text" id="upload-template-reinstall"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_REINSTALL'
							); ?></span>
						</div><?php
					}
					if (isset($arResult['TEMPLATE']['FILE_ID']) && $arResult['TEMPLATE']['FILE_ID'] > 0)
					{
						?>
						<div class="docs-template-download-file">
						<span class="docs-template-load-result-default-text" id="upload-template-download-file"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_DOWNLOAD'
							); ?></span>
						</div><?php
					}
					?>
					<div class="docs-template-download-file" id="upload-template-delete-file">
						<span class="docs-template-load-result-default-text"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_UPLOAD_NEW'
							); ?></span>
					</div>
				</div>
			</div>
			<div class="docs-template-load-crm" id="add-template-name-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-input-container">
						<label class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_NAME'
							); ?></label>
						<input class="docs-template-load-input" name="NAME" value="<?= htmlspecialcharsbx(
							$arResult['TEMPLATE']['NAME']
						); ?>" id="add-template-name-input"/>
					</div>
				</div>
			</div>
			<div class="docs-template-load-crm" id="add-template-active-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-check-container">
						<input class="docs-template-load-input" type="checkbox" name="ACTIVE" value="Y" id="add-template-active-input" <?=
							$arResult['TEMPLATE']['ACTIVE'] !== 'N' ? ' checked' : ''
						?>>
						<label class="docs-template-load-title" for="add-template-active-input"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_ACTIVE'
							); ?></label>
					</div>
					<div class="docs-template-load-check-container">
						<input class="docs-template-load-input" type="checkbox" name="WITH_STAMPS" value="Y" id="add-template-stamps-input" <?=
							$arResult['TEMPLATE']['WITH_STAMPS'] !== 'N' ? ' checked' : ''
						?>>
						<label class="docs-template-load-title" for="add-template-stamps-input"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_WITH_STAMPS'
							); ?></label>
					</div>
				</div>
			</div>
			<div class="docs-template-load-numerator" id="add-template-products-table-type-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-block-title-inner">
						<span class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_PRODUCTS_TABLE_VARIANT_TITLE'
							); ?></span>
					</div>
					<div class="docs-template-load-product-type-select-wrap">
						<select class="docs-template-load-select docs-template-load-indentation-14" id="docs-template-products-table-variant-select">
							<?php
							foreach ($arResult['PRODUCTS_TABLE_VARIANT'] as $type) : ?>
								<option value="<?= $type; ?>"
									<?= ($arResult['TEMPLATE']['PRODUCTS_TABLE_VARIANT'] === $type) ? 'selected="selected"' : ''; ?>
								><?= Loc::getMessage(
										'DOCGEN_TEMPLATE_ADD_PRODUCTS_TABLE_VARIANT' . ($type ? '_' . mb_strtoupper($type) : '')
									) ?></option>
							<?php
							endforeach; ?>
						</select>
					</div>
				</div>
			</div>
			<div class="docs-template-load-crm" id="add-template-provider-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-block-title-inner">
						<span class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_MAIN_PROVIDER'
							); ?></span>
					</div>
					<div class="docs-template-load-block-section" id="container-add-template-providers">
						<span class="docs-template-load-block-arrow" id="container-add-template-providers-show">
							<span class="docs-template-load-block-arrow-icon"></span>
						</span>
					</div>
				</div>
			</div>
			<div class="docs-template-load-user" id="add-template-user-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-block-title-inner">
						<span class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_USERS'
							); ?></span>
					</div>
					<div class="docs-template-load-block-section">
						<span class="docs-template-load-block-item docs-template-load-block-item-user" id="container-<?= $arResult['userSelectorName']; ?>">
						</span>
						<a class="docs-template-load-block-link" id="link_<?= $arResult['userSelectorName']; ?>" onclick="BX.DocumentGenerator.UploadTemplate.openUserSelector(this.parentNode); return false;"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_ADD_USER_LINK'
							); ?></a>
					</div>
				</div>
			</div>
			<?php
			$APPLICATION->IncludeComponent(
				'bitrix:main.ui.selector',
				'.default',
				[
					'ID' => $arResult['userSelectorName'],
					'BIND_ID' => 'link_' . $arResult['userSelectorName'],
					'ITEMS_SELECTED' => $arResult['TEMPLATE']['USERS'],
					'CALLBACK' => [
						'select' => 'BX.DocumentGenerator.UploadTemplate.onSelectUser',
						'unSelect' => 'BX.DocumentGenerator.UploadTemplate.onUnSelectUser',
					],
					'OPTIONS' => [
						'extranetContext' => false,
						'eventInit' => 'BX.DocumentGenerator.UploadTemplate:init',
						'eventOpen' => 'BX.DocumentGenerator.UploadTemplate:open',
						'context' => 'ADD_TEMPLATE_USER',
						'contextCode' => 'U',
						'useSearch' => 'Y',
						'userNameTemplate' => \CSite::GetNameFormat(),
						'useClientDatabase' => 'N',
						'allowEmailInvitation' => 'N',
						'enableAll' => 'Y',
						'enableDepartments' => 'Y',
						'enableSonetgroups' => 'Y',
						'departmentSelectDisable' => 'N',
						'allowAddUser' => 'N',
						'allowAddCrmContact' => 'N',
						'allowAddSocNetGroup' => 'N',
						'allowSearchEmailUsers' => 'N',
						'allowSearchCrmEmailUsers' => 'N',
						'allowSearchNetworkUsers' => 'N',
					],
				],
				false,
				['HIDE_ICONS' => 'Y'],
			);
			?>
			<div class="docs-template-load-numerator" id="add-template-region-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-block-title-inner">
						<span class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_TEMPLATE_REGION'
							); ?></span>
					</div>
					<div class="docs-template-load-num-select-wrap">
						<select class="docs-template-load-select docs-template-load-indentation-14" id="docs-template-region-select">
							<?php
							foreach ($arResult['REGIONS'] as $code => $description)
							{
								?>
								<option value="<?= htmlspecialcharsbx($code); ?>"
									<?= ($arResult['TEMPLATE']['REGION'] == $code) ? 'selected="selected"' : ''; ?>
								><?= htmlspecialcharsbx($description['TITLE']); ?></option>
								<?php
							} ?>
						</select>
						<div class="docs-template-load-num-btn-block">
							<div
								class="docs-template-load-num-btn<?= !is_numeric($arResult['TEMPLATE']['REGION']) ? ' template-edit-hidden' : ''; ?>"
								id="docs-template-region-edit-btn"
							><?= Loc::getMessage(
									'DOCGEN_TEMPLATE_ADD_TEMPLATE_NUMERATOR_EDIT'
								); ?></div>
							<div class="docs-template-load-num-btn" id="docs-template-region-create-btn"><?= Loc::getMessage(
									'DOCGEN_TEMPLATE_ADD_TEMPLATE_NUMERATOR_CREATE'
								); ?></div>
						</div>
					</div>
				</div>
			</div>
			<div class="docs-template-load-numerator" id="add-template-numerator-block">
				<div class="docs-template-load-block-wrap">
					<div class="docs-template-load-block-title-inner">
						<span class="docs-template-load-title"><?= Loc::getMessage(
								'DOCGEN_TEMPLATE_ADD_TEMPLATE_NUMERATOR'
							); ?></span>
					</div>
					<div class="docs-template-load-num-select-wrap">
						<select class="docs-template-load-select docs-template-load-indentation-14" id="docs-template-num-select">
							<?php
							foreach ($arResult['numeratorList'] as $numeratorData) : ?>
								<option value="<?= (int)$numeratorData['id']; ?>"
									<?= ($arResult['TEMPLATE']['NUMERATOR_ID'] == $numeratorData['id'])
										? 'selected="selected"' : ''; ?>
								><?= htmlspecialcharsbx($numeratorData['name']); ?></option>
							<?php
							endforeach; ?>
						</select>
						<div class="docs-template-load-num-btn-block">
							<div class="docs-template-load-num-btn" id="docs-template-numerator-edit-btn"><?= Loc::getMessage(
									'DOCGEN_TEMPLATE_ADD_TEMPLATE_NUMERATOR_EDIT'
								); ?></div>
							<div class="docs-template-load-num-btn" id="docs-template-numerator-create-btn"><?= Loc::getMessage(
									'DOCGEN_TEMPLATE_ADD_TEMPLATE_NUMERATOR_CREATE'
								); ?></div>
						</div>
					</div>
				</div>
			</div>
			<div class="docs-template-load-buttons docs-template-load-buttons-slider" id="add-template-buttons-block">
				<div class="docs-template-load-buttons-inner">
					<button class="ui-btn ui-btn-md ui-btn-success" id="add-template-save-button"><?= Loc::getMessage(
							'DOCGEN_TEMPLATE_ADD_SAVE'
						); ?></button>
					<button class="ui-btn ui-btn-md ui-btn-link" id="add-template-cancel-button"><?= Loc::getMessage(
							'DOCGEN_TEMPLATE_ADD_CANCEL'
						); ?></button>
				</div>
			</div>
		</form>
		<script>
			BX.ready(function()
			{
				BX.DocumentGenerator.UploadTemplate.init(<?=CUtil::PhpToJSObject($arResult['params']);?>);
				BX.DocumentGenerator.UploadTemplate.moduleId = '<?=CUtil::JSEscape($arParams['MODULE']);?>';
				BX.DocumentGenerator.UploadTemplate.providers = <?=\CUtil::PhpToJSObject($arResult['PROVIDERS']);?>;
				<?php if(!empty($arResult['TEMPLATE']))
				{
					?>BX.DocumentGenerator.UploadTemplate.setTemplateData(<?=CUtil::PhpToJSObject($arResult['TEMPLATE']);?>);<?php
				}
				?>BX.DocumentGenerator.UploadTemplate.initProviderPopup();
				BX.DocumentGenerator.UploadTemplate.regions = <?=\CUtil::PhpToJSObject(
					\Bitrix\Main\Engine\Response\Converter::toJson()->process($arResult['REGIONS'])
				);?>;
				BX.message(<?= \Bitrix\Main\Web\Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);
			});
		</script>
		<?php
	} ?>
</div>

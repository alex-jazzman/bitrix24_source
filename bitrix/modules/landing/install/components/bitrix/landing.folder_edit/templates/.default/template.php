<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Manager;
use Bitrix\Landing\Metrika;
use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\UI;

/** @var array $arResult */
/** @var array $arParams */
/** @var LandingBaseComponent $component */

if ($arResult['ERRORS'])
{
	?>
	<div id="landing-folder-edit__errors"
		class="ui-alert ui-alert-danger"
		role="alert"
		tabindex="-1"
		data-testid="folder-settings-error"><span class="ui-alert-message"><?
		foreach ($arResult['ERRORS'] as $error)
		{
			echo htmlspecialcharsbx($error) . '<br/>';
		}
		?></span></div>
	<script>
		BX.ready(function ()
		{
			BX('landing-folder-edit__errors').focus();
		});
	</script><?php
}
if ($arResult['FATAL'])
{
	return;
}

Loc::loadMessages(__FILE__);

Manager::setPageTitle(Loc::getMessage('LANDING_TPL_TITLE'));

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'landing_master',
	'sidepanel',
	'ui.forms',
	'ui.alerts',
	'ui.switcher',
]);

$row = $arResult['FOLDER'];

Toolbar::deleteFavoriteStar();
?>

<script>
	BX.ready(function ()
	{
		<?if ($arParams['SUCCESS_SAVE'] && !$arResult['ERRORS']):?>
			top.BX.onCustomEvent('BX.Landing.Filter:apply');
			BX.onCustomEvent('BX.Landing.Filter:apply');
			if (typeof top.BX.SidePanel !== 'undefined')
			{
			setTimeout(function ()
			{
					top.BX.SidePanel.Instance.close();
				}, 300);
			}
		<?php endif; ?>
	});
</script>
<div class="landing-folder-edit__workarea landing-folder-edit__scope"
	data-testid="folder-settings-root">
	<form action="<?= POST_FORM_ACTION_URI ?>"
		method="post"
		data-testid="folder-settings-form">
		<?= bitrix_sessid_post() ?>
		<input type="hidden" name="fields[SAVE_FORM]" value="Y"/>

		<div id="landing-folder-edit__editable-title" class="landing-folder-edit__section --without-bg">
			<div class="landing-folder-edit__section--text-title"
				data-landing-edit-text
				data-testid="folder-settings-title-text"><?= $row['TITLE']['CURRENT'] ?></div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w50" style="display: none !important;" data-landing-edit-input>
				<input type="text"
					name="fields[TITLE]"
					id="landing-folder-edit-title"
					class="ui-ctl-element"
					aria-label="<?= Loc::getMessage('LANDING_TPL_FIELD_TITLE') ?>"
					data-testid="folder-settings-title-input"
					value="<?= $row['TITLE']['CURRENT'] ?>"/>
			</div>
			<button type="button"
				class="landing-folder-edit__button-reset landing-folder-edit__section--icon --edit"
				data-landing-edit-control
				data-landing-edit-target="landing-folder-edit__editable-title"
				data-testid="folder-settings-title-edit-btn"
				aria-controls="landing-folder-edit-title"
				aria-label="<?= Loc::getMessage('LANDING_TPL_FOLDER_TITLE_EDIT') ?>">
				<i aria-hidden="true"></i>
			</button>
		</div>

		<div class="landing-folder-edit__section --inline">
			<label class="landing-folder-edit__section--title"
				for="landing-folder-edit-code"><?= Loc::getMessage('LANDING_TPL_FIELD_CODE') ?></label>
			<div id="landing-folder-edit__editable-path"
				class="landing-folder-edit__section--content --inline --path-link">
				<div class="landing-folder-edit__section--text-link"><?= htmlspecialcharsbx(
					rtrim($arResult['SITE_PATH'], '/') . $arResult['FOLDER_PATH']
				) ?></div>
				<div class="landing-folder-edit__section--text --space-around"
					data-landing-edit-text
					data-testid="folder-settings-code-text"><?= $row['CODE']['CURRENT'] ?></div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-inline landing-folder-edit__section-ui-input"
					style="display: none !important;"
					data-landing-edit-input>
					<input type="text"
						name="fields[CODE]"
						id="landing-folder-edit-code"
						class="ui-ctl-element"
						data-testid="folder-settings-code-input"
						value="<?= $row['CODE']['CURRENT'] ?>"/>
				</div>
				<button type="button"
					class="landing-folder-edit__button-reset landing-folder-edit__section--icon --edit"
					data-landing-edit-control
					data-landing-edit-target="landing-folder-edit__editable-path"
					data-testid="folder-settings-code-edit-btn"
					aria-controls="landing-folder-edit-code"
					aria-label="<?= Loc::getMessage('LANDING_TPL_FOLDER_CODE_EDIT') ?>">
					<i aria-hidden="true"></i>
				</button>
			</div>
		</div>

		<div class="landing-folder-edit__section">
			<div id="landing-folder-index-title"
				class="landing-folder-edit__section--title"><?= Loc::getMessage('LANDING_TPL_FIELD_INDEX_ID') ?></div>
			<div class="landing-folder-edit__section--content --inline --padding"
				role="group"
				aria-labelledby="landing-folder-index-title">
				<? if ($arResult['FOLDER_EMPTY']): ?>
					<div class="landing-folder-edit__section--text-link"
						style="margin-right: 5px"><?= Loc::getMessage('LANDING_TPL_FOLDER_IS_EMPTY') ?></div>
					<button type="button"
						id="landing-folder-index-create"
						class="landing-folder-edit__button-reset landing-folder-edit__section--text --link"
						data-testid="folder-settings-index-create-btn"
					><?= Loc::getMessage('LANDING_TPL_FOLDER_ADD_PAGE') ?></button>
				<? else: ?>
					<div class="landing-folder-edit__section--wrapper">
						<? if ($arResult['INDEX_LANDING']): ?>
							<a
								id="landing-folder-index-link"
								class="landing-folder-edit__section--text --link --link-icon"
								data-testid="folder-settings-index-link"
								title="<?= htmlspecialcharsbx($arResult['INDEX_LANDING']['TITLE']) ?>"
								href="<?= str_replace('#landing_edit#',
									$arResult['INDEX_LANDING']['ID'],
									$arParams['PAGE_URL_LANDING_VIEW']) ?>"
								target="_top"
							>
								<span class="landing-folder-index-link-text">
									<?= htmlspecialcharsbx($arResult['INDEX_LANDING']['TITLE']) ?>
								</span>
							</a>
						<? else: ?>
							<a id="landing-folder-index-link"
								class="landing-folder-edit__section--text --link --link-icon"
								data-testid="folder-settings-index-link"
								href="#"
								target="_top"
								hidden></a>
						<? endif; ?>

						<button type="button"
							id="landing-folder-select-index"
							class="landing-folder-edit__button-reset landing-folder-edit__section--text --link"
							data-testid="folder-settings-index-select-btn"
						><?= Loc::getMessage('LANDING_TPL_FOLDER_SELECT_PAGE') ?></button>

						<input type="hidden"
							name="fields[INDEX_ID]"
							id="landing-folder-index"
							data-testid="folder-settings-index-input"
							value="<?= $arResult['INDEX_LANDING']['ID'] ?? $row['INDEX_ID']['CURRENT'] ?>"/>

						<div id="landing-folder-metaog-group"
							data-testid="folder-settings-preview-group"
							style="display: <?= ($arResult['INDEX_LANDING']['ID'] || $row['INDEX_ID']['CURRENT'])
								? 'block' : 'none' ?>; padding-top: 18px">
							<div class="landing-folder-edit__section--text-link"
								style="margin-bottom: 8px"><?= Loc::getMessage('LANDING_TPL_FIELD_PREVIEW') ?></div>
							<div class="landing-folder-edit__preview">
								<div id="landing-folder-picture">
								</div>
							</div>
						</div>
					</div>
				<? endif; ?>
			</div>
		</div>
		<?php
		/* the block is filled in by the script once an index page is picked, so it has to exist beforehand */
		if (!$arResult['FOLDER_EMPTY']): ?>
			<div id="landing-folder-index-metablock"
				class="landing-folder-edit__section --without-margin"
				style="display: <?= $arResult['INDEX_LANDING'] ? 'flex' : 'none' ?>;"
			>
				<div class="landing-folder-edit__section--title">
					<? /*
				<label class="ui-ctl ui-ctl-checkbox ui-ctl-wa">
					<input type="checkbox" class="ui-ctl-element" id="landing-folder-edit__rich-url--toggler">
					<div class="ui-ctl-label-text"></div>
				</label>
			*/ ?>
				</div>
				<div class="landing-folder-edit__section--content --inline --padding-bottom">
					<div class="landing-folder-edit__section--wrapper">
						<? /*
					<div class="landing-folder-edit__preview-switcher">
						<div class="landing-folder-edit__preview-switcher--title"></div>
						<div class="landing-folder-edit__preview-switcher--control">
							<div class="ui-switcher"></div>
						</div>
					</div>
					*/ ?>
						<div class="landing-folder-edit__rich-url --show" id="landing-folder-edit__rich-url--wrapper">
							<div class="landing-folder-edit__rich-url--wrapper">
								<div class="landing-folder-edit__section--wrapper --margin-bottom">
									<label class="landing-folder-edit__section--text-link --margin-bottom"
										for="landing-folder-metaog-title"
									><?= Loc::getMessage('LANDING_TPL_FIELD_METAOG_TITLE') ?></label>
									<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
										<input type="text"
											name="fields[METAOG_TITLE]"
											id="landing-folder-metaog-title"
											class="ui-ctl-element"
											data-testid="folder-settings-og-title-input"
											value="<?= htmlspecialcharsbx(($arResult['INDEX_META']['METAOG_TITLE'] ?? '')
												?: ($arResult['INDEX_LANDING']['TITLE'] ?? '')) ?>"
											placeholder="<?= Loc::getMessage('LANDING_TPL_FIELD_METAOG_TITLE') ?>"
										/>
									</div>
								</div>
								<div class="landing-folder-edit__section--wrapper">
									<label class="landing-folder-edit__section--text-link --margin-bottom"
										for="landing-folder-metaog-description"
									><?= Loc::getMessage('LANDING_TPL_FIELD_METAOG_DESCRIPTION') ?></label>
									<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
										<input type="text"
											name="fields[METAOG_DESCRIPTION]"
											id="landing-folder-metaog-description"
											class="ui-ctl-element"
											data-testid="folder-settings-og-description-input"
											value="<?= htmlspecialcharsbx(($arResult['INDEX_META']['METAOG_DESCRIPTION'] ?? '')
												?: ($arResult['INDEX_LANDING']['DESCRIPTION'] ?? '')) ?>"
											placeholder="<?= Loc::getMessage('LANDING_TPL_FIELD_METAOG_DESCRIPTION') ?>"
										/>
									</div>
								</div>
								<input type="hidden"
									name="fields[METAOG_IMAGE]"
									id="landing-folder-metaog-image"
									value="<?= htmlspecialcharsbx($arResult['INDEX_META']['~METAOG_IMAGE'] ?? '') ?>"
								/>
								<input type="hidden"
									id="landing-folder-metaog-image-src"
									value="<?= htmlspecialcharsbx($arResult['INDEX_META']['METAOG_IMAGE'] ?? '') ?>"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		<?php endif; ?>
		<?php
		$APPLICATION->IncludeComponent(
			'bitrix:ui.button.panel',
			'',
			[
				'BUTTONS' => [
					[
						'type' => 'custom',
						'layout' => '<button id="ui-button-panel-save" name="save" value="Y" class="ui-btn ui-btn-success ui-btn-round">'
							. GetMessage('LANDING_TPL_BUTTON_SAVE')
							. '</button>',
					],
				'cancel',
			],
		]); ?>
	</form>
</div>

<script>
	BX.ready(function () {
		// rich url toggler

		BX.Landing.Env.getInstance().setOptions({params: {type: '<?php echo $arParams['TYPE']?>'}});

		<?php
			$createUrl = $component->getUrlAdd(false);
			$metrika = new Metrika\Metrika(
				Metrika\Categories::getBySiteType($arParams['TYPE']),
				Metrika\Events::openMarket,
				Metrika\Tools::getBySiteType($arParams['TYPE']),
			);
			$metrika
				->setSection(Metrika\Sections::page)
				->setSubSection('from_folder_edit')
			;
		?>
		BX.UI.Switcher.initByClassName();
		BX.Landing.Component.EditableField.bindAll();
		new BX.Landing.Component.FolderEdit({
			siteId: <?= $row['SITE_ID']['CURRENT'] ?: 0?>,
			indexLandingId: <?= $arResult['INDEX_LANDING']['ID'] ?? 0?>,
			siteType: '<?= \CUtil::jsEscape((string)$arParams['TYPE'])?>',
			folderId: <?= $row['ID']['CURRENT'] ?: 0?>,
			selectorCreateIndex: BX('landing-folder-index-create'),
			selectorIndexMetaBlock: BX('landing-folder-index-metablock'),
			selectorSelect: BX('landing-folder-select-index'),
			selectorPageLink: BX('landing-folder-index-link'),
			selectorFieldId: BX('landing-folder-index'),
			selectorPreviewBlock: BX('landing-folder-metaog-group'),
			selectorPreviewTitle: BX('landing-folder-metaog-title'),
			selectorPreviewDescription: BX('landing-folder-metaog-description'),
			selectorPreviewPicture: BX('landing-folder-metaog-image'),
			selectorPreviewSrcPicture: BX('landing-folder-metaog-image-src'),
			selectorPreviewPictureWrapper: BX('landing-folder-picture'),
			pathToLandingEdit: '<?= \CUtil::jsEscape($arParams['PAGE_URL_LANDING_VIEW']) ?>',
			pathToLandingCreate: '<?= \CUtil::jsEscape($metrika->parametrizeUri($createUrl)) ?>',
			isUseNewMarket: '<?= $component->isUseNewMarket() ?>',
		});
	});
</script>

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var \CMain $APPLICATION */
/** @var array $arResult */

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.notification',
	'ui.dialogs.messagebox',
	'ui.sidepanel-content',
	'mail.label.core',
]);

\Bitrix\Main\Loader::includeModule('ui');
\CJSCore::init('sidepanel');

$APPLICATION->setAdditionalCSS('/bitrix/components/bitrix/mail.client.config.labels/templates/.default/style.css');
$bodyClass = $APPLICATION->getPageProperty('BodyClass', '');
$APPLICATION->setPageProperty('BodyClass', trim($bodyClass . ' workarea-transparent no-background'));

$createButton = new Button([
	'text' => Loc::getMessage('MAIL_LABEL_CONFIG_CREATE_BUTTON'),
	'color' => Color::PRIMARY,
]);
$createButton->addAttribute('onclick', 'BX.Mail.Label.Config.List.openForm()');
$createButton->addAttribute('data-testid', 'mail-label-config-create-btn');
Toolbar::addButton($createButton, ButtonLocation::AFTER_TITLE);

if (!empty($arResult['FILTER']))
{
	Toolbar::addFilter($arResult['FILTER']);
}

$APPLICATION->setTitle($arResult['TITLE']);
?>
<div class="mail-label-config" data-testid="mail-label-config">
	<?php $APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', $arResult['GRID']); ?>
</div>
<script>
	BX.namespace('BX.Mail.Label.Config.List');

	BX.Mail.Label.Config.List = {
		init: function(options)
		{
			this.apiClient = BX.Mail.Label.Core.apiClient;
			this.gridId = options.gridId;
			this.formUrl = options.formUrl;
			this.labelNames = options.labels || {};

			BX.addCustomEvent('SidePanel.Slider:onMessage', this.onSliderMessage.bind(this));
		},

		openForm: function(labelId)
		{
			var url = labelId ? this.formUrl + '&id=' + labelId : this.formUrl;
			BX.SidePanel.Instance.open(url, { width: 680, cacheable: false });
		},

		onSliderMessage: function(message)
		{
			if (message.getEventId() !== 'mail-label-saved')
			{
				return;
			}

			var labelId = message.getData().labelId;
			this.reloadGrid(function(grid)
			{
				if (labelId > 0)
				{
					var row = grid.instance.getRows().getById(labelId);
					if (row)
					{
						row.select();
					}
				}
			});
		},

		confirmDelete: function(labelId)
		{
			var name = this.labelNames[labelId] || '';
			BX.UI.Dialogs.MessageBox.confirm(
				BX.message('MAIL_LABEL_CONFIG_DELETE_CONFIRM').replace('#name#', BX.Text.encode(name)),
				BX.message('MAIL_LABEL_CONFIG_DELETE_TITLE'),
				function()
				{
					return this.apiClient.delete(labelId).then(this.reloadGrid.bind(this), function(response)
					{
						BX.UI.Notification.Center.notify({ content: this.extractError(response) });
					}.bind(this));
				}.bind(this),
				BX.message('MAIL_LABEL_CONFIG_DELETE'),
			);
		},

		reloadGrid: function(callback)
		{
			var grid = BX.Main.gridManager.getById(this.gridId);
			if (!grid)
			{
				return;
			}

			grid.instance.reloadTable('GET', {}, function()
			{
				if (typeof callback === 'function')
				{
					callback(grid);
				}
			});
		},

		extractError: function(response)
		{
			var error = response && response.errors && response.errors[0] && response.errors[0].message;

			return error || BX.message('MAIL_LABEL_CONFIG_ERROR_GENERIC');
		},
	};

	BX.ready(function() {
		<?= 'BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');' ?>

		BX.Mail.Label.Config.List.init({
			gridId: <?= \CUtil::PhpToJSObject($arResult['GRID_ID']) ?>,
			formUrl: <?= \CUtil::PhpToJSObject($arResult['FORM_URL']) ?>,
			labels: <?= \CUtil::PhpToJSObject($arResult['LABEL_NAMES']) ?>,
		});
	});
</script>

<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var \CMain $APPLICATION */
/** @var array $arResult */

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.notification',
	'ui.system.input',
	'ui.system.menu',
	'ui.sidepanel-content',
	'mail.label.core',
]);

\Bitrix\Main\Loader::includeModule('ui');
\CJSCore::init('sidepanel');

Toolbar::deleteFavoriteStar();

$APPLICATION->setAdditionalCSS('/bitrix/components/bitrix/mail.client.config.labels/templates/.default/style.css');
$bodyClass = $APPLICATION->getPageProperty('BodyClass', '');
$APPLICATION->setPageProperty('BodyClass', trim($bodyClass . ' workarea-transparent no-background'));

$isEdit = !empty($arResult['EDIT_ID']);
$submitText = Loc::getMessage($isEdit ? 'MAIL_LABEL_CONFIG_FORM_SUBMIT_EDIT' : 'MAIL_LABEL_CONFIG_FORM_SUBMIT_CREATE');
$submitTestId = $isEdit ? 'mail-label-config-save-btn' : 'mail-label-config-add-btn';
?>
<div class="mail-label-config-form" data-role="mail-label-config-form" data-testid="mail-label-config-form" role="group" aria-labelledby="mail-label-config-form-section-title">
	<h2 class="mail-label-config-form__section-title" id="mail-label-config-form-section-title" data-testid="mail-label-config-section-title"><?= htmlspecialcharsbx(Loc::getMessage('MAIL_LABEL_CONFIG_FORM_SECTION_TITLE')) ?></h2>
	<div class="mail-label-config-form__description"><?= htmlspecialcharsbx(Loc::getMessage('MAIL_LABEL_CONFIG_FORM_DESCRIPTION')) ?></div>
	<div class="mail-label-config-form__body">
		<div class="mail-label-config-form__input" data-role="mail-label-config-form-input"></div>
		<div class="mail-label-config-form__mailbox" data-role="mail-label-config-form-mailbox"></div>
		<div class="mail-label-config-form__controls">
			<button
				type="button"
				class="ui-btn ui-btn-lg --air --style-filled ui-btn-no-caps"
				data-role="mail-label-config-form-submit"
				data-testid="<?= $submitTestId ?>"
			><?= htmlspecialcharsbx($submitText) ?></button>
			<button
				type="button"
				class="ui-btn ui-btn-lg --air --style-plain-no-accent ui-btn-no-caps"
				data-role="mail-label-config-form-cancel"
				data-testid="mail-label-config-cancel-btn"
			><?= htmlspecialcharsbx(Loc::getMessage('MAIL_LABEL_CONFIG_FORM_CANCEL')) ?></button>
		</div>
	</div>
</div>
<script>
	BX.namespace('BX.Mail.Label.Config.Form');

	BX.Mail.Label.Config.Form = {
		init: function(options)
		{
			this.apiClient = BX.Mail.Label.Core.apiClient;
			this.editId = options.editId || 0;
			this.container = options.container;
			this.input = null;
			this.field = null;
			this.errorElement = null;

			this.isEdit = this.editId > 0;
			this.isSubmitting = false;
			this.mailboxes = Array.isArray(options.mailboxes) ? options.mailboxes : [];
			this.selectedMailboxId = options.mailboxId || 0;
			this.mailboxName = options.mailboxName || '';
			this.mailboxInput = null;
			this.mailboxField = null;
			this.mailboxMenu = null;

			this.submitButton = this.container.querySelector('[data-role="mail-label-config-form-submit"]');
			this.cancelButton = this.container.querySelector('[data-role="mail-label-config-form-cancel"]');
			this.inputContainer = this.container.querySelector('[data-role="mail-label-config-form-input"]');
			this.mailboxContainer = this.container.querySelector('[data-role="mail-label-config-form-mailbox"]');

			this.renderInput(options.value || '');
			this.renderMailboxControl();

			BX.Event.bind(this.submitButton, 'click', this.submit.bind(this));
			BX.Event.bind(this.cancelButton, 'click', this.close.bind(this));

			this.input.focus();
		},

		renderMailboxControl: function()
		{
			if (!this.mailboxContainer)
			{
				return;
			}

			if (this.isEdit)
			{
				this.mailboxInput = new BX.UI.System.Input.Input({
					label: BX.message('MAIL_LABEL_CONFIG_MAILBOX_LABEL'),
					ariaLabel: BX.message('MAIL_LABEL_CONFIG_MAILBOX_LABEL'),
					value: this.mailboxName,
					design: 'disabled',
					readonly: true,
					dataTestId: 'mail-label-config-mailbox',
				});
				BX.Dom.append(this.mailboxInput.render(), this.mailboxContainer);

				return;
			}

			this.mailboxInput = new BX.UI.System.Input.Input({
				label: BX.message('MAIL_LABEL_CONFIG_MAILBOX_LABEL'),
				ariaLabel: BX.message('MAIL_LABEL_CONFIG_MAILBOX_LABEL'),
				value: this.mailboxLabel(this.selectedMailboxId),
				dropdown: true,
				readonly: true,
				dataTestId: 'mail-label-config-mailbox-select',
				onClick: this.openMailboxMenu.bind(this),
			});
			var wrapper = this.mailboxInput.render();
			BX.Dom.append(wrapper, this.mailboxContainer);

			this.mailboxField = wrapper.querySelector('.ui-system-input-value');
			if (this.mailboxField)
			{
				this.mailboxField.setAttribute('aria-haspopup', 'dialog');
				this.mailboxField.setAttribute('aria-expanded', 'false');
				BX.Event.bind(this.mailboxField, 'keydown', this.onMailboxKeydown.bind(this));
			}

			this.mailboxMenu = new BX.UI.System.Menu({
				bindElement: wrapper,
				items: this.buildMailboxMenuItems(),
				focusTrap: { initialFocus: true },
				events: {
					onClose: this.setMailboxExpanded.bind(this, false),
				},
			});
		},

		buildMailboxMenuItems: function()
		{
			var items = [this.createMailboxMenuItem(0, BX.message('MAIL_LABEL_CONFIG_MAILBOX_ALL'))];

			this.mailboxes.forEach(function(mailbox)
			{
				items.push(this.createMailboxMenuItem(mailbox.id, mailbox.name));
			}.bind(this));

			return items;
		},

		createMailboxMenuItem: function(mailboxId, title)
		{
			return {
				id: String(mailboxId),
				title: title,
				isSelected: this.selectedMailboxId === mailboxId,
				onClick: this.selectMailbox.bind(this, mailboxId),
			};
		},

		selectMailbox: function(mailboxId)
		{
			this.selectedMailboxId = mailboxId;
			this.mailboxInput.setValue(this.mailboxLabel(mailboxId));
		},

		mailboxLabel: function(mailboxId)
		{
			if (mailboxId === 0)
			{
				return BX.message('MAIL_LABEL_CONFIG_MAILBOX_ALL');
			}

			var match = this.mailboxes.filter(function(mailbox)
			{
				return mailbox.id === mailboxId;
			})[0];

			return match ? match.name : '';
		},

		openMailboxMenu: function()
		{
			if (!this.mailboxMenu)
			{
				return;
			}

			this.mailboxMenu.updateItems(this.buildMailboxMenuItems());
			this.setMailboxExpanded(true);
			this.mailboxMenu.show(this.mailboxInput.render());
		},

		onMailboxKeydown: function(event)
		{
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')
			{
				event.preventDefault();
				this.openMailboxMenu();
			}
		},

		setMailboxExpanded: function(expanded)
		{
			if (this.mailboxField)
			{
				this.mailboxField.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			}
		},

		renderInput: function(value)
		{
			this.input = new BX.UI.System.Input.Input({
				label: BX.message('MAIL_LABEL_CONFIG_NAME_LABEL'),
				placeholder: BX.message('MAIL_LABEL_CONFIG_NAME_PLACEHOLDER'),
				ariaLabel: BX.message('MAIL_LABEL_CONFIG_NAME_LABEL'),
				value: value,
				dataTestId: 'mail-label-config-add-input',
			});
			BX.Dom.append(this.input.render(), this.inputContainer);

			this.field = this.inputContainer.querySelector('.ui-system-input-value');
			this.errorElement = this.inputContainer.querySelector('.ui-system-input-label.--error');
			if (this.errorElement)
			{
				this.errorElement.id = 'mail-label-config-form-error';
				this.errorElement.setAttribute('role', 'alert');
			}
			if (this.field)
			{
				BX.Event.bind(this.field, 'keydown', this.onFieldKeydown.bind(this));
				BX.Event.bind(this.field, 'input', this.clearError.bind(this));
			}
		},

		onFieldKeydown: function(event)
		{
			if (event.key === 'Enter')
			{
				event.preventDefault();
				this.submit();
			}
			else if (event.key === 'Escape')
			{
				event.preventDefault();
				this.close();
			}
		},

		submit: function()
		{
			if (this.isSubmitting)
			{
				return;
			}

			var name = this.input.getValue().trim();
			if (name === '')
			{
				this.setError(BX.message('MAIL_LABEL_CONFIG_ERROR_EMPTY'));

				return;
			}

			this.clearError();
			this.setSubmitting(true);

			var request = this.editId
				? this.apiClient.update(this.editId, name)
				: this.apiClient.add(name, this.selectedMailboxId);

			request.then(this.onSuccess.bind(this), this.onError.bind(this));
		},

		onSuccess: function(label)
		{
			var labelId = this.editId || (label && label.id) || 0;
			var slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				BX.SidePanel.Instance.postMessage(slider, 'mail-label-saved', { labelId: labelId });
			}
			this.close();
		},

		onError: function(response)
		{
			this.setSubmitting(false);
			this.setError(this.extractError(response));
			this.input.focus();
		},

		setSubmitting: function(isSubmitting)
		{
			this.isSubmitting = isSubmitting;
			BX.Dom.toggleClass(this.submitButton, 'ui-btn-wait', isSubmitting);
			this.submitButton.disabled = isSubmitting;
		},

		setError: function(message)
		{
			this.input.setError(message);

			if (!this.field)
			{
				return;
			}

			this.field.setAttribute('aria-invalid', 'true');

			var describedBy = this.field.getAttribute('aria-describedby') || '';
			if (describedBy.indexOf('mail-label-config-form-error') === -1)
			{
				this.field.setAttribute('aria-describedby', (describedBy + ' mail-label-config-form-error').trim());
			}
		},

		clearError: function()
		{
			if (this.input.getError() === '')
			{
				return;
			}

			this.input.setError('');

			if (!this.field)
			{
				return;
			}

			this.field.removeAttribute('aria-invalid');

			var describedBy = (this.field.getAttribute('aria-describedby') || '')
				.split(' ')
				.filter(function(token)
				{
					return token !== '' && token !== 'mail-label-config-form-error';
				})
				.join(' ');

			if (describedBy === '')
			{
				this.field.removeAttribute('aria-describedby');
			}
			else
			{
				this.field.setAttribute('aria-describedby', describedBy);
			}
		},

		close: function()
		{
			var slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				slider.close();
			}
		},

		extractError: function(response)
		{
			var error = response && response.errors && response.errors[0] && response.errors[0].message;

			return error || BX.message('MAIL_LABEL_CONFIG_ERROR_GENERIC');
		},
	};

	BX.ready(function() {
		<?= 'BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');' ?>

		BX.Mail.Label.Config.Form.init({
			container: document.querySelector('[data-role="mail-label-config-form"]'),
			editId: <?= (int)($arResult['EDIT_ID'] ?? 0) ?>,
			value: <?= \CUtil::PhpToJSObject((string)($arResult['EDIT_NAME'] ?? '')) ?>,
			mailboxId: <?= $isEdit ? (int)($arResult['EDIT_MAILBOX_ID'] ?? 0) : 0 ?>,
			mailboxName: <?= \CUtil::PhpToJSObject((string)($arResult['EDIT_MAILBOX_NAME'] ?? '')) ?>,
			mailboxes: <?= Json::encode($arResult['MAILBOXES'] ?? []) ?>,
		});
	});
</script>

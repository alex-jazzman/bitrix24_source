/**
 * @module mail/templates/src/template-navigator
 */
jn.define('mail/templates/src/template-navigator', (require, exports, module) => {
	const { Loc } = require('loc');
	const { TemplatePicker } = require('mail/templates/src/template-picker');
	const { TemplateList } = require('mail/templates/src/template-list');
	const { TemplatePreview } = require('mail/templates/src/template-preview');
	const { TemplateCreate } = require('mail/templates/src/template-create');

	class TemplateNavigator
	{
		constructor({ pageManager = PageManager } = {})
		{
			this.pageManager = pageManager;
			this.quickWidget = null;
			this.session = null;
			this.onSelect = null;
			this.onReturnFocus = null;
			this.completed = false;
			this.parentWidget = pageManager;
			this.managePath = '';
			this.emailFrom = '';
		}

		open({ session, onSelect, onReturnFocus, managePath = '', emailFrom = '', parentWidget = this.pageManager })
		{
			this.session = session;
			this.onSelect = onSelect;
			this.onReturnFocus = onReturnFocus;
			this.completed = false;
			this.parentWidget = parentWidget;
			this.managePath = String(managePath ?? '');
			this.emailFrom = String(emailFrom ?? '');

			return this.openWidget(Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_TITLE'), (layoutWidget) => {
				this.quickWidget = layoutWidget;
				layoutWidget.showComponent(new TemplatePicker({
					session,
					managePath: this.managePath,
					onSelect: this.select,
					onPreview: this.preview,
					onCreate: () => this.openCreate(this.quickWidget),
					onOpenAll: () => this.openFullList(),
				}));
			});
		}

		preview = async (reference, parentWidget = this.quickWidget) => {
			const { template } = await this.session.api.prepare(reference);

			return this.openWidget(template.subject, (layoutWidget) => {
				layoutWidget.showComponent(new TemplatePreview({ template }));
			}, parentWidget);
		};

		openFullList()
		{
			return this.openWidget(Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_ALL_TITLE'), (layoutWidget) => {
				const list = new TemplateList({
					session: this.session,
					onSelect: this.select,
					onPreview: (reference) => this.preview(reference, layoutWidget),
					onCreate: () => this.openCreate(layoutWidget, () => list.reload()),
				});
				layoutWidget.showComponent(list);
			}, this.quickWidget);
		}

		openCreate(parentWidget, onCreated = null)
		{
			return this.openWidget(Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_CREATE'), (layoutWidget) => {
				layoutWidget.showComponent(new TemplateCreate({
					layoutWidget,
					api: this.session.api,
					emailFrom: this.emailFrom,
					onCreated: (reference) => {
						this.session.prioritizeCreated(reference);
						void this.session.loadQuick(true);
						onCreated?.();
					},
				}));
			}, parentWidget);
		}

		select = (reference) => {
			if (this.completed)
			{
				return;
			}

			this.completed = true;
			const quickWidget = this.quickWidget;
			this.quickWidget = null;
			this.closeWidget(quickWidget, () => {
				try
				{
					this.onReturnFocus?.();
				}
				catch (failure)
				{
					console.error(failure);
				}
				this.onSelect?.(reference);
			});
		};

		closeWidget(widget, onClosed)
		{
			if (!widget?.close)
			{
				onClosed();

				return;
			}

			let completed = false;
			const complete = () => {
				if (!completed)
				{
					completed = true;
					onClosed();
				}
			};

			try
			{
				const result = widget.close(complete);
				if (result && typeof result.then === 'function')
				{
					result.then(complete).catch(complete);
				}
			}
			catch (failure)
			{
				complete();
			}
		}

		openWidget(title, onReady, parentWidget = this.parentWidget)
		{
			return new Promise((resolve, reject) => {
				let resolved = false;
				const ready = (layoutWidget) => {
					if (resolved)
					{
						return;
					}

					resolved = true;
					onReady(layoutWidget);
					resolve(layoutWidget);
				};
				const result = parentWidget.openWidget('layout', {
					modal: true,
					titleParams: { text: title, type: 'section' },
					onReady: ready,
				});

				if (result && typeof result.then === 'function')
				{
					result.then(ready).catch(reject);
				}
			});
		}
	}

	module.exports = { TemplateNavigator };
});

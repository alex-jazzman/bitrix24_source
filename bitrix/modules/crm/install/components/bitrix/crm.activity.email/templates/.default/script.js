
;(function() {



	if (window.BXCrmActivityEmailController)
		return;
	var BXCrmActivityEmailController = {};
	const SAVE_LAST_TEMPLATE_INACTIVE_CLASS = 'crm-activity-email-save-last-template-toggle--inactive';
	const SAVE_LAST_TEMPLATE_MENU_ITEM_ID = 'crm-email-template-save-last-used-toggle';

	BXCrmActivityEmailController.init = function (options)
	{
		var ctrl = this;

		if (this.__inited)
			return;

		this.options = options;
		this.isSaveLastTemplateToggleRequestRunning = false;
		this.isSaveLastTemplateStateSynchronized = true;
		this.saveLastTemplateMenuIds = new Set();

		this.__dummyNode = document.createElement('DIV');

		this.templates = {
			'0': {'FROM': '', 'SUBJECT': '', 'BODY': ''}
		};

		this.templateLoader = new BX.Loader({
			target: document.querySelector(".crm-activity-planner-slider-header-control-select"),
			size: 20,
			mode: 'inline',
			offset: {
				left: '4%',
				top: '-2%'
			}
		});

		if ('edit' != this.options.type)
		{
			if (this.options.pageSize < 1 || this.options.pageSize > 100)
				this.options.pageSize = 5;

			this.__log = {'a': 0, 'b': 0};

			var details = BX('crm-activity-email-details-'+this.options.activityId);

			var moreA = BX.findChildByClassName(details.parentNode, 'crm-task-list-mail-more-a', true);
			BX.bind(moreA, 'click', this.handleLogClick.bind(this, 'a'));

			var moreB = BX.findChildByClassName(details.parentNode, 'crm-task-list-mail-more-b', true);
			BX.bind(moreB, 'click', this.handleLogClick.bind(this, 'b'));

			var items = BX.findChildrenByClassName(details.parentNode, 'crm-task-list-mail-item', true);
			for (var i in items)
			{
				var log = items[i].getAttribute('data-log').toLowerCase();
				if (typeof this.__log[log] != 'undefined')
					this.__log[log]++;

				BX.bind(items[i], 'click', this.handleLogItemClick.bind(this, items[i].getAttribute('data-id')));
			}

			BX.Event.EventEmitter.subscribe(
				'BXMailMessageActions:CRM_EXCLUDE',
				function (event)
				{
					if (ctrl.options.mailMessageId == event.getData().messageId)
					{
						var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
						slider.setCacheable(false);
						slider.close();
					}
				}
			);
		}

		this.__inited = true;
	};

	BXCrmActivityEmailController.applySaveLastTemplateState = function (isEnabled) {
		this.options.saveLastUsedTemplate = isEnabled ? 'Y' : 'N';

		this.saveLastTemplateMenuIds.forEach((menuId) => {
			const menu = BX.PopupMenu.getMenuById(menuId);
			if (!menu)
			{
				this.saveLastTemplateMenuIds.delete(menuId);

				return;
			}

			const menuItem = menu.getMenuItem(SAVE_LAST_TEMPLATE_MENU_ITEM_ID);
			const element = menuItem ? menuItem.getContainer() : null;
			if (!element)
			{
				return;
			}

			if (isEnabled)
			{
				BX.removeClass(element, SAVE_LAST_TEMPLATE_INACTIVE_CLASS);
			}
			else
			{
				BX.addClass(element, SAVE_LAST_TEMPLATE_INACTIVE_CLASS);
			}
		});
	};

	BXCrmActivityEmailController.synchronizeSaveLastTemplateState = function (fallbackSaveLastUsedTemplate) {
		const stateToRestore = fallbackSaveLastUsedTemplate ?? this.options.saveLastUsedTemplate;
		this.isSaveLastTemplateStateSynchronized = false;
		this.isSaveLastTemplateToggleRequestRunning = true;

		return BX.ajax.runAction('crm.api.mail.MailTemplate.getSaveLastUsedTemplate').then(
			(response) => {
				this.applySaveLastTemplateState(response.data === true);
				this.isSaveLastTemplateStateSynchronized = true;
				this.isSaveLastTemplateToggleRequestRunning = false;
			},
			() => {
				this.applySaveLastTemplateState(stateToRestore === 'Y');
				this.isSaveLastTemplateToggleRequestRunning = false;
			},
		);
	};

	BXCrmActivityEmailController.setSaveLastTemplateState = function (isEnabled) {
		if (this.isSaveLastTemplateToggleRequestRunning)
		{
			return;
		}

		const previousSaveLastUsedTemplate = this.options.saveLastUsedTemplate;
		this.isSaveLastTemplateStateSynchronized = false;
		this.isSaveLastTemplateToggleRequestRunning = true;
		this.applySaveLastTemplateState(isEnabled);

		const saveLastUsedTemplate = () => BX.ajax.runAction(
			'crm.api.mail.MailTemplate.setSaveLastUsedTemplate',
			{
				data: {
					enabled: isEnabled,
				},
			},
		);
		const completeSaveLastTemplateToggle = (isSuccess) => {
			if (!isSuccess)
			{
				this.applySaveLastTemplateState(previousSaveLastUsedTemplate === 'Y');
			}

			this.isSaveLastTemplateStateSynchronized = true;
			this.isSaveLastTemplateToggleRequestRunning = false;
		};

		saveLastUsedTemplate().then(
			(response) => {
				completeSaveLastTemplateToggle(response.data === true);
			},
			() => {
				saveLastUsedTemplate().then(
					(response) => {
						if (response.data === true)
						{
							completeSaveLastTemplateToggle(true);
						}
						else
						{
							this.synchronizeSaveLastTemplateState(previousSaveLastUsedTemplate);
						}
					},
					() => {
						this.synchronizeSaveLastTemplateState(previousSaveLastUsedTemplate);
					},
				);
			},
		);
	};

	BXCrmActivityEmailController.initScrollable = function()
	{
		if (!this.__scrollable)
		{
			if (document.scrollingElement)
				this.__scrollable = document.scrollingElement;
		}

		if (!this.__scrollable)
		{
			if (document.documentElement.scrollTop > 0 || document.documentElement.scrollLeft > 0)
				this.__scrollable = document.documentElement;
			else if (document.body.scrollTop > 0 || document.body.scrollLeft > 0)
				this.__scrollable = document.body;
		}

		if (!this.__scrollable)
		{
			window.scrollBy(1, 1);

			if (document.documentElement.scrollTop > 0 || document.documentElement.scrollLeft > 0)
				this.__scrollable = document.documentElement;
			else if (document.body.scrollTop > 0 || document.body.scrollLeft > 0)
				this.__scrollable = document.body;

			window.scrollBy(-1, -1);
		}

		return this.__scrollable;
	}

	BXCrmActivityEmailController.scrollWrapper = function (pos)
	{
		var ctrl = this;

		if (!this.initScrollable())
			return;

		if (this.__scrollable.__animation)
		{
			clearInterval(this.__scrollable.__animation);
			this.__scrollable.__animation = null;
		}

		var start = this.__scrollable.scrollTop;
		var delta = pos - start;
		var step = 0;
		this.__scrollable.__animation = setInterval(function()
		{
			step++;
			ctrl.__scrollable.scrollTop = start + delta * step/8;

			if (step >= 8)
			{
				clearInterval(ctrl.__scrollable.__animation);
				ctrl.__scrollable.__animation = null;
			}
		}, 20);
	};

	BXCrmActivityEmailController.scrollTo = function (node1, node2)
	{
		if (!this.initScrollable())
			return;

		var pos0 = BX.pos(this.__scrollable);

		pos0.top    += this.__scrollable.scrollTop;
		pos0.bottom += this.__scrollable.scrollTop;

		var pos1 = BX.pos(node1);
		var pos2 = typeof node2 == 'undefined' || node2 === node1 ? pos1 : BX.pos(node2);

		if (pos1.top < pos0.top)
		{
			this.scrollWrapper(this.__scrollable.scrollTop - (pos0.top - pos1.top));
		}
		else if (pos2.bottom > pos0.bottom)
		{
			this.scrollWrapper(Math.min(
				this.__scrollable.scrollTop - (pos0.top - pos1.top),
				this.__scrollable.scrollTop + (pos2.bottom - pos0.bottom)
			));
		}
	};

	BXCrmActivityEmailController.handleLogClick = function (log, event)
	{
		BX.PreventDefault(event);

		var button = BX.findChildByClassName(
			BX('crm-activity-email-details-'+this.options.activityId).parentNode,
			'crm-task-list-mail-more-'+log,
			true
		);
		this.loadLog(log, button);
	};

	BXCrmActivityEmailController.loadLog = function (log, button)
	{
		var ctrl = this;

		var separator = button.parentNode;

		if (this['__loadingLog'+log])
			return;

		this['__loadingLog'+log] = true;
		BX.ajax({
			method: 'POST',
			url: this.options.ajaxUrl,
			data: {
				act: 'log',
				id: this.options.activityId,
				log: log + this.__log[log],
				size: this.options.pageSize,
				template: 'slider'
			},
			dataType: 'json',
			onsuccess: function(json)
			{
				ctrl['__loadingLog'+log] = false;

				if (json.result != 'error')
				{
					ctrl.__dummyNode.innerHTML = json.html;

					var marker = log == 'a' ? BX.findNextSibling(separator, {'tag': 'div'}) : separator;
					while (ctrl.__dummyNode.childNodes.length > 0)
					{
						var item = separator.parentNode.insertBefore(ctrl.__dummyNode.childNodes[0], marker);
						if (item.nodeType == 1 && BX.hasClass(item, 'crm-task-list-mail-item'))
						{
							ctrl.__log[log]++;

							BX.addClass(item, 'crm-activity-email-show-animation-rev');
							BX.bind(item, 'click', ctrl.handleLogItemClick.bind(ctrl, item.getAttribute('data-id')));
						}
					}

					if (json.count < ctrl.options.pageSize)
						separator.style.display = 'none';

					if (log == 'b')
						ctrl.scrollWrapper(ctrl.__scrollable.scrollHeight);

					ctrl.__dummyNode.innerHTML = '';
				}
			},
			onfailure: function()
			{
				ctrl['__loadingLog'+log] = false;
			}
		});
	};

	BXCrmActivityEmailController.handleLogItemClick = function (activityId, event)
	{
		event = event || window.event;
		if (event.target && event.target.tagName && event.target.tagName.toUpperCase() == 'A')
			return;

		if (window.getSelection)
		{
			if (window.getSelection().toString().trim() != '')
				return;
		}
		else if (document.selection)
		{
			if (document.selection.createRange().htmlText.trim() != '')
				return;
		}

		BX.PreventDefault(event);

		this.toggleLogItem(activityId);
	};

	BXCrmActivityEmailController.toggleLogItem = function (activityId)
	{
		var ctrl = this;

		var wrapper = BX('crm-activity-email-details-'+this.options.activityId).parentNode;

		var logItem = BX.findChildByClassName(wrapper, 'crm-activity-email-logitem-'+activityId, false);
		var details = BX.findChildByClassName(wrapper, 'crm-activity-email-details-'+activityId, false);

		var opened  = BX.hasClass(logItem, 'crm-task-list-mail-item-open');

		BX.toggleClass(logItem, 'crm-task-list-mail-item-open');
		logItem.setAttribute('aria-expanded', opened ? 'false' : 'true');

		var collapseBtn = BX.findChildByClassName(details, 'crm-task-list-mail-item-collapse-btn', true);
		collapseBtn?.setAttribute('aria-expanded', opened ? 'false' : 'true');

		if (opened)
		{
			details.style.display = 'none';

			BX.addClass(logItem, 'crm-activity-email-show-animation-rev');
			logItem.style.display = '';
		}
		else
		{
			BX.removeClass(details, 'crm-activity-email-show-animation-rev');
			BX.addClass(details, 'crm-activity-email-show-animation');
			details.style.display = '';

			if (details.getAttribute('data-empty'))
			{
				BX.ajax({
					method: 'POST',
					url: this.options.ajaxUrl,
					data: {
						act: 'logitem',
						id: activityId,
						template: 'slider'
					},
					dataType: 'json',
					onsuccess: function (json)
					{
						if (json.result == 'error')
						{
							details.innerHTML = json.error;
							return;
						}

						var response = BX.processHTML(json.html);

						BX.removeClass(details, 'crm-activity-email-show-animation');
						BX.removeClass(details, 'crm-activity-email-show-animation-rev');
						setTimeout(function ()
						{
							details.style.textAlign = '';
							details.innerHTML = response.HTML;

							if (details.offsetHeight > 0)
								logItem.style.display = 'none';

							BX.ajax.processScripts(response.SCRIPT);

							BX.addClass(details, 'crm-activity-email-show-animation-rev');

							var button = BX.findChildByClassName(details, 'crm-task-list-mail-item-inner-header', true);
							BX.bind(button, 'click', ctrl.handleLogItemClick.bind(ctrl, activityId));

							var collapseBtn = BX.findChildByClassName(details, 'crm-task-list-mail-item-collapse-btn', true);
							if (collapseBtn)
							{
								BX.bind(collapseBtn, 'click', function (e) {
									e.stopPropagation();
									ctrl.toggleLogItem(activityId);
								});
							}

							ctrl.scrollTo(details);
						}, 10);

						details.removeAttribute('data-empty');
					}
				});

				this.scrollTo(logItem, details);
			}
			else
			{
				logItem.style.display = 'none';

				this.scrollTo(details);
			}
		}
	};

	BXCrmActivityEmailController.removeLogItem = function (activityId)
	{
		var wrapper = BX('crm-activity-email-details-'+this.options.activityId).parentNode;

		var logItem = BX.findChildByClassName(wrapper, 'crm-activity-email-logitem-'+activityId, false);
		var details = BX.findChildByClassName(wrapper, 'crm-activity-email-details-'+activityId, false);

		var log = logItem.getAttribute('data-log').toLowerCase();
		if (typeof this.__log[log] != 'undefined')
			this.__log[log]--;

		setTimeout(function()
		{
			wrapper.removeChild(details);
			wrapper.removeChild(logItem);
		}, 200);

		details.style.maxHeight = (details.offsetHeight*1.5)+'px';
		details.style.transition = 'max-height .2s ease-in';
		details.offsetHeight;
		details.style.maxHeight = '0px';

		BX.removeClass(details, 'crm-activity-email-show-animation');
		BX.removeClass(details, 'crm-activity-email-show-animation-rev');
		BX.addClass(details, 'crm-activity-email-close-animation');
	};

	BXCrmActivityEmailController.applyTemplate = function (id, ownerType, ownerId, callback)
	{
		var ctrl = this;

		var key = id > 0 ? [id, ownerType, ownerId].join(':') : id;

		if (this.templates[key])
		{
			callback(this.templates[key]);
			return;
		}

		BX.ajax({
			'url': '/bitrix/components/bitrix/crm.activity.editor/ajax.php?action=prepare_mail_template&templateid='+id,
			'method': 'POST',
			'dataType': 'json',
			'data': {
				sessid: BX.bitrix_sessid(),
				ACTION: 'PREPARE_MAIL_TEMPLATE',
				TEMPLATE_ID: id,
				OWNER_TYPE: ownerType,
				OWNER_ID: ownerId,
				CONTENT_TYPE: 'HTML'
			},
			onsuccess: function(data)
			{
				if (data.DATA)
				{
					ctrl.templates[key] = data.DATA;
					callback(data.DATA);
				}
			}
		});
	}

	var BXCrmActivityEmail = function (options)
	{
		var self = this;

		this.ctrl = BXCrmActivityEmailController;
		this.options = options;
		this.progressPercent = 0;

		if (!(this.ctrl.options.templates && this.ctrl.options.templates.length > 0))
		{
			this.ctrl.options.templates = this.options.templates;
		}

		this.__dummyNode = document.createElement('DIV');

		this.htmlForm = BX(this.options.formId);
		this.htmlForm.__wrapper = this.htmlForm.parentNode;

		if (this.htmlForm.__inited)
			return;

		if ('edit' != this.ctrl.options.type)
		{
			this.__wrapper = BX('crm-activity-email-details-'+this.ctrl.options.activityId);
			if (this.options.activityId != this.ctrl.options.activityId)
				this.__wrapper = BX.findChildByClassName(this.__wrapper.parentNode, 'crm-activity-email-details-'+this.options.activityId, false);

			BX.addCustomEvent(
				'CrmActivityEmail:replyButtonClick',
				function (source, guard)
				{
					if (source !== self)
					{
						const closePromise = self.hideReplyForm();
						guard?.waitUntil(closePromise);
					}
				}
			);

			this.initMessageBody();

			// show hidden rcpt items
			var rcptMore = BX.findChildrenByClassName(this.__wrapper, 'crm-task-list-mail-item-to-list-more');
			for (var i in rcptMore)
			{
				BX.bind(rcptMore[i], 'click', function (event)
				{
					BX.findChildByClassName(this.parentNode, 'crm-task-list-mail-item-to-list-hidden', false).style.display = 'inline';
					this.style.display = 'none';

					BX.PreventDefault(event);
				});
			}

			// outgoing message read confirmed handler
			BX.addCustomEvent('onPullEvent-crm', function (command, params)
			{
				if (command != 'activity_email_read_confirmed')
					return;
				if (params.ID != self.options.activityId)
					return;

				var items = BX.findChildrenByClassName(self.__wrapper, 'read-confirmed-datetime', true);
				if (items && items.length > 0)
				{
					for (var i in items)
						BX.adjust(items[i], {text: BX.message('CRM_ACT_EMAIL_VIEW_READ_CONFIRMED_SHORT')});
				}
			});

			var replyButton  = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-message-panel', true);
			var replyLink    = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-reply', true);
			var replyAllLink = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-answertoall', true);
			var forwardLink  = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-resend', true);
			var skipLink     = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-skip', true);
			var spamLink     = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-spam', true);
			var deleteLink   = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-delete', true);

			BX.bind(replyButton, 'click', this.showReplyForm.bind(this));
			BX.bind(replyAllLink, 'click', this.showReplyForm.bind(this, true));
			BX.bind(replyLink, 'click', this.showReplyForm.bind(this));

			BX.bind(forwardLink, 'click', function ()
			{
				var typeId = (BX.CrmActivityType || top.BX.CrmActivityType || { 'email': 4 }).email;
				window.location.href = '/bitrix/components/bitrix/crm.activity.planner/slider.php'
					+ '?site_id=' + BX.message('SITE_ID') + '&ajax_action=ACTIVITY_EDIT'
					+ '&TYPE_ID=' + typeId + '&FROM_ACTIVITY_ID=' + self.options.activityId
					+ '&MESSAGE_TYPE=FWD&IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER';
			});

			BX.bind(skipLink, 'click', this.delete.bind(this, 'skip'));
			BX.bind(spamLink, 'click', this.delete.bind(this, 'spam'));
			BX.bind(deleteLink, 'click', this.delete.bind(this));

			this.bindDiscussInChat();

			if (options.isAjaxBody && options.bodyElementId)
			{
				this.ajaxLoadMessageBody();
			}
		}

		var mailForm = BXMainMailForm.getForm(this.options.formId);

		mailForm.options.ownerId = this.ctrl.options.ownerId;
		mailForm.options.ownerType = this.ctrl.options.ownerType;

		BX.addCustomEvent(mailForm, 'MailForm:footer:buttonClick', BXCrmActivityEmail.handleFooterButtonClick.bind(this));
		BX.addCustomEvent(mailForm, 'MailForm:submit', BXCrmActivityEmail.handleFormSubmit.bind(this));
		BX.addCustomEvent(mailForm, 'MailForm:submit:ajaxSuccess', BXCrmActivityEmail.handleFormSubmitSuccess.bind(this));

		this.htmlForm.__inited = true;

		this.initAnalytics();
	};

	BXCrmActivityEmail.prototype.initMessageBody = function ()
	{
		this.initIframe();
	};

	BXCrmActivityEmail.prototype.initIframe = function()
	{
		const options = this.options;
		const messageBodyElement = document.getElementById(options.bodyElementId);
		if (!messageBodyElement)
		{
			return;
		}

		const activityId = parseInt(messageBodyElement.dataset.activityId, 10);
		const useAjax = messageBodyElement.dataset.useAjax === '1';

		if (!useAjax)
		{
			const messageHtml = messageBodyElement.dataset.messageHtml;
			if (messageHtml)
			{
				this.renderMessageBody(messageBodyElement, messageHtml, activityId);
			}
		}
	};

	BXCrmActivityEmail.prototype.renderMessageBody = function(container, html, activityId)
	{
		if (!this.messageBody)
		{
			this.messageBody = new BX.Mail.MessageBody({
				container,
				messageId: activityId,
				prefix: 'crm-mail-msg',
			});
		}

		this.messageBodyContainer = container.closest('.crm-task-list-mail-border-bottom');
		this.messageBody.renderTo(html);

		if (typeof this.messageBody.bindPrintControl !== 'function')
		{
			return;
		}

		const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
		if (!slider)
		{
			return;
		}

		slider.setPrintable(true);
		this.messageBody.bindPrintControl({
			slider,
			getHeaderHtml: () => this.collectPrintHeaderHtml(),
			getHeaderStyles: () => this.getPrintHeaderStyles(),
		});
	};

	BXCrmActivityEmail.prototype.collectPrintHeaderHtml = function ()
	{
		const esc = BX.util.htmlspecialchars;
		let html = '';

		const subject = document.querySelector('.crm-activity-planner-slider-header-title');
		if (subject)
		{
			html += '<div class="print-subject">' + esc(subject.textContent.trim()) + '</div>';
		}

		html += '<div class="print-meta">';

		const senderName = this.messageBodyContainer?.querySelector('.crm-task-list-mail-item-inner-description-name-link, '
			+ '.crm-task-list-mail-item-inner-description-name');
		const senderEmail = this.messageBodyContainer?.querySelector('.crm-task-list-mail-item-inner-description-mail');
		if (senderName || senderEmail)
		{
			html += '<div class="print-from">';
			if (senderName)
			{
				html += '<span class="print-from-name">' + esc(senderName.textContent.trim()) + '</span>';
			}
			if (senderEmail)
			{
				html += (senderName ? ' &lt;' : '&lt;') + esc(senderEmail.textContent.trim()) + '&gt;';
			}
			html += '</div>';
		}

		const recipientLines = this.messageBodyContainer?.querySelectorAll(
			'.crm-task-list-mail-item-inner-send > span',
		) ?? [];
		recipientLines.forEach(function (line) {
			const label = line.querySelector('.crm-task-list-mail-item-inner-send-item');
			const recipients = line.querySelectorAll(
				'.crm-task-list-mail-item-inner-send-mail-link, .crm-task-list-mail-item-inner-send-mail',
			);
			if (!label || recipients.length === 0)
			{
				return;
			}

			const names = [];
			recipients.forEach(function (recipient) {
				names.push(esc(recipient.textContent.trim()));
			});
			html += '<div class="print-rcpt-line">';
			html += '<span class="print-rcpt-label">' + esc(label.textContent.trim()) + '</span> ';
			html += names.join(', ');
			html += '</div>';
		});

		const date = this.messageBodyContainer?.querySelector('.crm-task-list-mail-item-inner-description-date');
		if (date)
		{
			html += '<div class="print-date">' + esc(date.textContent.trim()) + '</div>';
		}

		html += '</div>';

		return html;
	};

	BXCrmActivityEmail.prototype.getPrintHeaderStyles = function ()
	{
		return '.print-header { display: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; padding: 10px 20px 0; }'
			+ '.print-subject { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 12px; }'
			+ '.print-meta { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e3e5; }'
			+ '.print-from { margin-bottom: 4px; }'
			+ '.print-from-name { font-size: 15px; font-weight: bold; color: #333; }'
			+ '.print-rcpt-line { margin-bottom: 2px; color: #80868e; font-size: 13px; }'
			+ '.print-rcpt-label { color: #80868e; }'
			+ '.print-date { margin-top: 4px; color: #80868e; font-size: 13px; }'
			+ '@media print { .print-header { display: block; padding: 0 20px; } }';
	};

	BXCrmActivityEmail.prototype.insertBodyText = function (html)
	{
		const messageBodyElement = document.getElementById(this.options.bodyElementId);
		if (messageBodyElement)
		{
			const activityId = this.options.activityId;
			this.renderMessageBody(messageBodyElement, html, activityId);
		}
	};

	BXCrmActivityEmail.handleFooterButtonClick = function (form, button)
	{
		if (BX.hasClass(button, 'main-mail-form-cancel-button'))
		{
			if ('edit' == this.ctrl.options.type)
			{
				top.BX.SidePanel.Instance.getSliderByWindow(window).close();
			}
			else
			{
				this.hideReplyForm(true, 'cancel');
			}
		}
	};

	BXCrmActivityEmail.handleFormSubmit = function (form, event)
	{
		var fields = this.htmlForm.elements;
		var emptyRcpt = true;
		for (var i = 0; i < fields.length; i++)
		{
			if ('DATA[to][]' == fields[i].name && fields[i].value.length > 0)
				emptyRcpt = false;
		}
		if (emptyRcpt)
		{
			// @TODO: hide on select
			form.showError(BX.message('CRM_ACT_EMAIL_REPLY_EMPTY_RCPT'));
			return BX.PreventDefault(event);
		}

		// @TODO: use events
		var uploads, items, totalSize = 0;
		for (var i in form.postForm.controllers)
		{
			if (!form.postForm.controllers.hasOwnProperty(i))
				continue;

			if (form.postForm.controllers[i].storage != 'disk')
				continue;

			try
			{
				uploads = 0;
				uploads = form.postForm.controllers[i].handler.agent.upload.filesCount;
			}
			catch (err) {}

			if (uploads > 0)
			{
				// @TODO: hide on complete
				form.showError(BX.message('CRM_ACT_EMAIL_REPLY_UPLOADING'));
				return BX.PreventDefault(event);
			}

			if (
				!BX.message('CRM_LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE')
				&& BX.message('CRM_ACT_EMAIL_MAX_SIZE') > 0
			)
			{
				try
				{
					items = form.postForm.controllers[i].handler.agent.queue.items.items;
					totalSize = Object.keys(items).reduce(
						function (sum, k)
						{
							return sum + (items[k].file ? parseInt(items[k].file.sizeInt || items[k].file.size) : 0);
						},
						totalSize
					);
				}
				catch (err) {}
			}
		}

		if (
			!BX.message('CRM_LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE')
			&& BX.message('CRM_ACT_EMAIL_MAX_SIZE') > 0
			&& BX.message('CRM_ACT_EMAIL_MAX_SIZE') <= Math.ceil(totalSize / 3) * 4
		) // base64 coef.
		{
			form.showError(BX.message('CRM_ACT_EMAIL_MAX_SIZE_EXCEED'));
			return BX.PreventDefault(event);
		}

		if ('edit' == this.ctrl.options.type)
		{
			var hiddenWrapper = BX('crm_act_email_create_hidden');
			hiddenWrapper.innerHTML = '';

			var fields = BX.findChildren(document, {'tag': 'input'}, true);
			for (var i = 0, clone; i < fields.length; i++)
			{
				if (fields[i].name && fields[i].name.indexOf('__crm_activity_planner[') >= 0)
				{
					clone = fields[i].cloneNode(true);
					clone.removeAttribute('id');
					clone.setAttribute('name', 'DATA'+fields[i].name.substr('__crm_activity_planner'.length));

					hiddenWrapper.appendChild(clone);
				}
			}
		}
	};

	BXCrmActivityEmail.prototype.initDraft = function(mailForm)
	{
		if (mailForm.__draftCoordinator)
		{
			return Promise.resolve(mailForm.__draftCoordinator);
		}
		if (mailForm.__draftBootstrapPromise)
		{
			return mailForm.__draftBootstrapPromise;
		}
		if (!this.options.draft?.available || !BX.Mail?.Draft)
		{
			return Promise.resolve(null);
		}

		const closeCanceledAttempt = () => {
			mailForm.__draftBootstrapCanceled = true;
			if ('edit' === this.ctrl.options.type)
			{
				top.BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}
			else
			{
				this.hideReplyForm(true, 'cancel');
			}
		};

		const draftIdNode = this.htmlForm.querySelector('[data-role="mail-draft-id"]');
		const draftRevisionNode = this.htmlForm.querySelector('[data-role="mail-draft-revision"]');
		const applyDraftState = (draftId, revision = '') => {
			if (draftIdNode)
			{
				draftIdNode.value = draftId;
			}
			if (draftRevisionNode)
			{
				draftRevisionNode.value = revision;
			}
		};
		// Only the bootstrap of this very open may fill the fields: until it reports a draft, the state
		// of the previous open must not stay there for a send or for a failed bootstrap to pick up.
		applyDraftState('');

		// The inline reply form is reused between opens, so the error of a failed bootstrap has to be
		// taken back as soon as autosave works again: otherwise the form keeps claiming that it does
		// not save the message. The mark sits on the alert, not on the error node, because showError()
		// replaces the content of the node and the mark leaves with the alert it belongs to.
		const draftErrorMark = 'data-crm-draft-load-error';
		const getFormErrorAlert = () => {
			if (!mailForm.formWrapper)
			{
				return null;
			}

			return BX.findChildByClassName(mailForm.formWrapper, 'main-mail-form-error', true)?.firstElementChild;
		};
		const showDraftLoadError = () => {
			mailForm.showError(BX.message('CRM_ACT_EMAIL_DRAFT_LOAD_ERROR'));
			getFormErrorAlert()?.setAttribute(draftErrorMark, '');
		};
		const hideDraftLoadError = () => {
			const alertNode = getFormErrorAlert();
			if (alertNode?.hasAttribute(draftErrorMark))
			{
				alertNode.remove();
			}
		};

		const draftContext = BX.Mail.Draft.resolveCrmDraftContext(this.options.draft);
		mailForm.__draftBootstrapPromise = BX.Mail.Draft.bootstrapCrmDraft({
			form: mailForm,
			clientId: this.options.draft.clientId,
			context: {
				contextType: 'crm',
				crmEntityTypeId: draftContext.entityTypeId,
				crmEntityId: draftContext.entityId,
			},
			onDraftIdChange: applyDraftState,
			onCancel: closeCanceledAttempt,
		}).then((coordinator) => {
			if (coordinator)
			{
				mailForm.__draftCoordinator = coordinator;
				hideDraftLoadError();

				// A restored draft reports no state change: applying its snapshot publishes no change
				// event, so without this the fields stay empty until the first autosave and sending
				// right after the restore would not complete the draft.
				const { draftId, revision } = coordinator.getState();
				applyDraftState(draftId ?? '', revision ?? '');
			}

			return coordinator;
		}).catch((error) => {
			// A failed bootstrap leaves the form open and usable, just without a coordinator and
			// without autosave: setDraftLoading(false) is released by bootstrapCrmDraft itself.
			// Only onCancel closes the form, so the error stays readable in the live region.
			console.error('CRM mail draft bootstrap failed', error);
			showDraftLoadError();

			return null;
		}).finally(() => {
			mailForm.__draftBootstrapPromise = null;
		});

		return mailForm.__draftBootstrapPromise;
	};

	BXCrmActivityEmail.handleFormSubmitSuccess = function (form, data)
	{
		if (data.ERROR && data.ERROR.length > 0 || data.ERROR_HTML && data.ERROR_HTML.length > 0)
		{
			data.ERROR = !data.ERROR? [] : data.ERROR;
			data.ERROR = !BX.type.isArray(data.ERROR)? [data.ERROR]  : data.ERROR;

			var errorNode = document.createElement('DIV');
			for (var i = 0; i < data.ERROR.length; i++)
			{
				errorNode.appendChild(document.createTextNode(data.ERROR[i]));
				errorNode.appendChild(document.createElement('BR'));
			}

			data.ERROR_HTML = !data.ERROR_HTML? [] : data.ERROR_HTML;
			data.ERROR_HTML = !BX.type.isArray(data.ERROR_HTML)? [data.ERROR_HTML]  : data.ERROR_HTML;
			for (var j = 0; j < data.ERROR_HTML.length; ++j)
			{
				errorNode.innerHTML += data.ERROR_HTML[i] + "<br>";
			}

			form.showError(errorNode.innerHTML);
		}
		else
		{
			BX.SidePanel.Instance.postMessage(
				window,
				'ACTIVITY_CREATE',
				{
					action: 'ACTIVITY_CREATE',
					source_id: this.ctrl.options.activityId,
					target_id: data.ACTIVITY.ID,
				},
			);

			if ('edit' != this.ctrl.options.type)
			{
				this.hideReplyForm(true);
			}

			var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
			slider.setCacheable(false);
			slider.close();
		}
	};

	// aria-disabled, not the disabled attribute: the initiator holds the keyboard focus while the
	// form is opening, and disabling it natively would drop that focus to <body>.
	BXCrmActivityEmail.prototype.setReplyPending = function (pending)
	{
		this.__replyPending = pending;

		const initiators = [
			BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-message-panel', true),
			BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-reply', true),
			BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-answertoall', true),
		];

		initiators.forEach((initiator) => {
			if (!initiator)
			{
				return;
			}

			initiator.setAttribute('aria-busy', pending ? 'true' : 'false');
			initiator.setAttribute('aria-disabled', pending ? 'true' : 'false');
		});
	};

	BXCrmActivityEmail.prototype.showReplyForm = async function(isReplyAll)
	{
		if (this.__replyPending)
		{
			return;
		}

		var mailForm = BXMainMailForm.getForm(this.options.formId);
		var replyButton = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-message-panel', true);
		this.setReplyPending(true);
		try
		{
			const switchPromises = [];
			BX.onCustomEvent('CrmActivityEmail:replyButtonClick', [this, {
				waitUntil: (promise) => switchPromises.push(Promise.resolve(promise)),
			}]);
			const closeResults = await Promise.all(switchPromises);
			if (closeResults.some((result) => result === false))
			{
				return;
			}

			if (this.htmlForm.parentNode === this.__dummyNode)
				this.htmlForm.__wrapper.appendChild(this.htmlForm);

			var isInit = mailForm.init({
				isReplyAll,
			});

			// The form is shown and takes the focus BEFORE the draft round trip: the loading state
			// of setDraftLoading has to land on a visible subtree, and the focus has to leave the
			// initiator before it gets hidden. The focus target is the form element itself, which
			// stays outside the inert wrapper for the whole waiting time.
			BX.addClass(this.htmlForm, 'crm-activity-email-show-animation');
			this.htmlForm.style.display = '';
			BX.onCustomEvent(mailForm, 'MailForm:show', []);
			this.ctrl.scrollTo(this.htmlForm);
			this.htmlForm.tabIndex = -1;
			this.htmlForm.focus({ preventScroll: true });

			replyButton.style.display = 'none';

			const coordinator = await this.initDraft(mailForm);
			if (mailForm.__draftBootstrapCanceled)
			{
				// closeCanceledAttempt has already hidden the form and returned the focus.
				mailForm.__draftBootstrapCanceled = false;

				return;
			}
			if (this.htmlForm.parentNode === this.__dummyNode)
			{
				// Another message took the form over while the draft was loading.
				return;
			}

			// Both prefills start with cleanFields(), so running one over an existing draft wipes its
			// recipients and the next autosave stores the loss. The check is on the draft itself, not
			// on the moment it appeared: a repeated click on the initiators of an already open form
			// lands here as well, with the draft either restored on this open or created by autosave
			// during it.
			const fieldsBelongToDraft = coordinator?.getState().draftId > 0;

			if (isInit === false && !fieldsBelongToDraft)
			{
				if (isReplyAll === true)
				{
					mailForm.fillFieldsForReplyAll();
				}
				else
				{
					mailForm.fillFieldsForReply();
				}
			}
		}
		finally
		{
			this.setReplyPending(false);
		}
	};

	BXCrmActivityEmail.prototype.hideReplyForm = function (skipCloseGuard, closeReason)
	{
		var mailForm = BXMainMailForm.getForm(this.options.formId);
		if (!skipCloseGuard)
		{
			return mailForm.requestClose('crm-inline-switch', () => this.hideReplyForm(true, closeReason));
		}

		// Every open has to bootstrap again. A coordinator kept alive across closes would autosave the
		// field reset of fillFieldsForReply() into the stored draft, and while another message of the
		// thread edits the same draft it would keep a stale revision, killing autosave on conflict.
		mailForm.__draftCoordinator?.destroy();
		mailForm.__draftCoordinator = null;

		var replyButton = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-message-panel', true);

		BX.addClass(replyButton, 'crm-activity-email-show-animation-rev');
		replyButton.style.display = '';

		this.htmlForm.style.display = 'none';

		BX.onCustomEvent(mailForm, 'MailForm:hide', []);

		this.__dummyNode.appendChild(this.htmlForm);

		this.setReplyPending(false);
		if (closeReason === 'cancel')
		{
			// Only the user closing this very form gets the focus back; a switch to another message
			// must not pull the focus to the button of the message being left.
			replyButton.focus();
		}
	};

	BXCrmActivityEmail.prototype.bindDiscussInChat = function ()
	{
		const button = BX.findChildByClassName(this.__wrapper, 'js-crm-discuss-in-chat', true);
		if (!button)
		{
			return;
		}

		const activityId = parseInt(button.getAttribute('data-activity-id'), 10);
		if (!activityId)
		{
			return;
		}

		BX.bind(button, 'click', function (event)
		{
			event.preventDefault();
			BX.Mail.Client.Action.DiscussInChat.open(activityId, button, 'crm');
		});
	};

	BXCrmActivityEmail.prototype.delete = function (act)
	{
		var self = this;

		var warnId = 'CRM_ACT_EMAIL_DELETE_CONFIRM';
		switch (act)
		{
			case 'skip':
				warnId = 'CRM_ACT_EMAIL_SKIP_CONFIRM';
				break;
			case 'spam':
				warnId = 'CRM_ACT_EMAIL_SPAM_CONFIRM';
				break;
		}

		if (!window.confirm(BX.message(warnId)))
			return false;

		var deleteLink = BX.findChildByClassName(this.__wrapper, 'crm-task-list-mail-item-control-icon-delete', true);

		var data = {
			sessid: BX.bitrix_sessid(),
			ACTION: 'DELETE',
			IS_SKIP: 'skip' == act ? 'Y' : 'N',
			IS_SPAM: 'spam' == act ? 'Y' : 'N',
			ITEM_ID: this.options.activityId
		};

		var fields = BX.findChildren(deleteLink.parentNode, {tag: 'input'}, true);
		for (var i = 0; i < fields.length; i++)
		{
			if (fields[i].name)
				data[fields[i].name] = fields[i].value;
		}

		BX.ajax({
			'url': '/bitrix/components/bitrix/crm.activity.editor/ajax.php?id='+this.options.activityId+'&action=delete',
			'method': 'POST',
			'dataType': 'json',
			'data': data,
			onsuccess: function(data)
			{
				BX.SidePanel.Instance.postMessage(
					window,
					'ACTIVITY_DELETE',
					{
						action: 'ACTIVITY_DELETE',
						source_id: self.ctrl.options.activityId,
						target_id: self.options.activityId,
					},
				);

				if (self.ctrl.options.activityId != self.options.activityId)
				{
					self.ctrl.removeLogItem(self.options.activityId);
				}
				else
				{
					var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
					slider.setCacheable(false);
					slider.close();
				}
			}
		});
	};

	BXCrmActivityEmail.prototype.batch = function (batch)
	{
		var mailForm = BXMainMailForm.getForm(this.options.formId);

		mailForm.getField('DATA[cc]')[batch?'hide':'show']();
		mailForm.getField('DATA[bcc]')[batch?'hide':'show']();
	};

	BXCrmActivityEmail.prototype.activateTemplate = function(event, item, formId, ownerType, ownerId, selector)
	{
		var mailForm = BXMainMailForm.getForm(formId);
		var self = this;
		self.ctrl.templateLoader.show();
		self.ctrl.applyTemplate(item.__id, ownerType, ownerId, function (data)
		{
			self.hasTemplateSignature = false;
			if (data.FROM && data.FROM.length > 0)
			{
				var fromField = mailForm.getField('DATA[from]');

				fromField.setValue(data.FROM);
				if (fromField.params.folded)
					fromField.unfold();
			}

			const htmlFields = self.htmlForm.elements;
			const forwardedId = htmlFields['DATA[FORWARDED_ID]'] ? htmlFields['DATA[FORWARDED_ID]'].value : 0;
			const repliedId = htmlFields['DATA[REPLIED_ID]'] ? htmlFields['DATA[REPLIED_ID]'].value : 0;

			if (!(forwardedId > 0 || repliedId > 0))
			{
				const subjectField = mailForm.getField('DATA[subject]');

				subjectField.setValue(data.SUBJECT ?? '');
				if (subjectField.params.folded)
				{
					subjectField.unfold();
				}
			}

			const filesInfo = data.FILES_INFO && data.FILES_INFO.length > 0 ? data.FILES_INFO : [];
			mailForm.getField('DATA[__diskfiles]').setValue(filesInfo);
			let message = data.BODY && data.BODY.length > 0 ? `<div>${data.BODY}</div>` : '<br>';
			message = updateSignatureNodeId(self, message, mailForm.formId, mailForm.signatureNodeId);
			if (mailForm.sharingLinkNodeClass)
			{
				message = mailForm.updateSharingLinkNode(message, self.options.calendarLink);
			}
			mailForm.getField('DATA[message]').setValue(message, {quote: true, signature: !self.hasTemplateSignature, filesInfo: filesInfo});
			self.ctrl.templateLoader.hide();

			const range = mailForm.editor.selection.GetRange();
			const firstNode = mailForm.editor.GetIframeDoc().body.firstChild;
			const firstNodeTagName = firstNode.tagName;

			if (firstNodeTagName === 'BR')
			{
				return;
			}

			if (firstNodeTagName === 'DIV' && firstNode.firstChild)
			{
				range.setStartBefore(firstNode.firstChild);
				range.setStartBefore(firstNode.firstChild);
				mailForm.editor.selection.SetSelection(range);

				return;
			}

			range.setStartBefore(firstNode);
			range.setStartBefore(firstNode);
			mailForm.editor.selection.SetSelection(range);
		});

		BX.adjust(selector, {html: item.text});
		if (item.menuWindow)
		{
			item.menuWindow.close();
		}

	};

	const updateSignatureNodeId = function(self, template, formId, newSignatureNodeId)
	{
		const crmSignaturePattern = '"main_mail_form+\\w+_signature_+\\w+"';
		const regExp = new RegExp(crmSignaturePattern, 'gi');
		if (regExp.test(template))
		{
			self.hasTemplateSignature = true;

			return template.replace(regExp, `"${newSignatureNodeId}"`);
		}

		return template;
	};

	BXCrmActivityEmail.prototype.templateMenu = function (ownerType, ownerId, selector)
	{
		var self = this;
		const templates = [];
		if (this.ctrl.options.templates)
		{
			this.ctrl.options.templates.forEach((template) => {
				if (template.entityType === ownerType || template.entityType === '')
				{
					templates.push(template);
				}
			});
		}

		const acceptClass = 'menu-popup-item-accept';
		const menuId = 'crm-activity-email-' + this.options.activityId + '-template-menu';
		this.ctrl.saveLastTemplateMenuIds.add(menuId);
		let saveTemplateClassName = 'save-last-template-toggle ' + acceptClass;

		if(this.ctrl.options.saveLastUsedTemplate !== 'Y')
		{
			saveTemplateClassName += ' ' + SAVE_LAST_TEMPLATE_INACTIVE_CLASS;
		}

		this.classSeparator = 'main-buttons-submenu-delimiter';
		this.classHiddenLabel = 'main-buttons-hidden-label';
		this.classSubmenuItem = 'main-buttons-submenu-item';

		const items = [];

		const lastUsedTemplateIdNode = BX('crm_act_email_create_last_used_template_id');

		if (this.ctrl.options.isEnabledSavingLastUsedTemplate === 'Y')
		{
			items.push(
				{
					delimiter: true,
					html: '<span>' + BX.message('CRM_ACT_EMAIL_TEMPLATE_SETTINGS_TITLE') + '</span>',
					className: [
						this.classSeparator,
						this.classSubmenuItem,
						this.classHiddenLabel
					].join(' '),
				},
				{
					id: SAVE_LAST_TEMPLATE_MENU_ITEM_ID,
					text: BX.message('CRM_ACT_EMAIL_TEMPLATE_SAVE_LAST_TEMPLATE'),
					className: saveTemplateClassName,
					attrs: {
						'data-testid': 'crm-email-template-save-last-used-toggle',
					},
					onclick: function (e, item){
						self.ctrl.setSaveLastTemplateState(
							item.getContainer().classList.contains(SAVE_LAST_TEMPLATE_INACTIVE_CLASS),
						);
					}
				},
				{
					text: BX.message('CRM_ACT_EMAIL_TEMPLATE_SETTINGS'),
					className: 'menu-popup-item-none',
					attrs: {
						'data-testid': 'crm-email-template-settings-action',
					},
					onclick: function (e){
						BX.SidePanel.Instance.open("/crm/configs/mailtemplate/", {
							cacheable: false,
							width: 1080,
							events: {
								onOpen(){
									BX.PopupMenu.getCurrentMenu().close();
								},
								onClose(){
									self.ctrl.templateLoader.show();
									BX.ajax.runAction('crm.api.mail.MailTemplate.getTitleList',{
										data: {
											ownerTypeId: self.ctrl.options.activityOwnerTypeId
										}
									}).then((response)=> {
										const templates = response.data;
										BX.PopupMenu.getCurrentMenu().destroy();
										self.ctrl.templates = {
											'0': {'FROM': '', 'SUBJECT': '', 'BODY': ''}
										};
										self.ctrl.options.templates = templates;
										self.ctrl.templateLoader.hide();
									});
								}
							}
						});
					}
				},
				{
					delimiter: true,
					html: '<span>' + BX.message('CRM_ACT_EMAIL_TEMPLATE_LIST_TITLE') + '</span>',
					className: [
						this.classSeparator,
						this.classSubmenuItem,
						this.classHiddenLabel
					].join(' ')
				},
			);
		}

		items.push({
			__id: 0,
			text: BX.message('CRM_ACT_EMAIL_CREATE_NOTEMPLATE'),
			className: 'menu-popup-no-icon',
			onclick: function (e, item) {
				this.activateTemplate(null, item, self.options.formId, ownerType, ownerId, selector);
				if (lastUsedTemplateIdNode)
				{
					BX.adjust(lastUsedTemplateIdNode, {props: {value: 0}});
				}
			}.bind(this)
		});

		for (var i in templates)
		{
			items.push({
				__id: templates[i].id,
				text: BX.util.htmlspecialchars(templates[i].title),
				title: BX.util.htmlspecialchars(templates[i].title),
				className: 'menu-popup-no-icon',
				onclick: function (e, item) {
					if (lastUsedTemplateIdNode)
					{
						BX.adjust(lastUsedTemplateIdNode, {props: {value: item.__id}})
					}
					this.activateTemplate(null, item, self.options.formId, ownerType, ownerId, selector);

				}.bind(this)
			});
		}

		BX.PopupMenu.show(
			menuId,
			selector, items,
			{
				maxWidth: 300,
				maxHeight: 600,
				offsetLeft: 40,
				angle: true,
				closeByEsc: true,
				events: {
					onPopupShow: function(){
						BX.Event.EventEmitter.emit(this,'CrmActivityEmail::onShowTemplatesList', {
							target: '.save-last-template-toggle',
							stepId: 'step-save-last-used-template',
						})
					}.bind(this),
				}
			}
		);

		if (
			!this.ctrl.isSaveLastTemplateStateSynchronized
			&& !this.ctrl.isSaveLastTemplateToggleRequestRunning
		)
		{
			this.ctrl.synchronizeSaveLastTemplateState();
		}
	};

	BXCrmActivityEmail.prototype.ajaxLoadMessageBody = function ()
	{
		const activityId = this.options.activityId;
		if (!activityId)
		{
			return;
		}
		this.bindErrorClose();
		this.startProgressTimer();

		BX.ajax.runAction('bitrix:crm.mail.message.getDescriptionAndQuote', {
			data: { id: activityId },
		}).then((response) => {
			if (BX.type.isNotEmptyObject(response.data))
			{
				this.handleSuccessResponse(response.data);
			}
			else
			{
				this.handleFailedResponse();
			}
		}, () => {
			this.handleFailedResponse();
		});
	}

	BXCrmActivityEmail.prototype.handleSuccessResponse = function (data)
	{
		this.stopProgress();
		if (BX.type.isNotEmptyObject(data) && BX.type.isString(data.descriptionHtml))
		{
			this.insertBodyText(data.descriptionHtml);

			if (BX.type.isString(data.quote))
			{
				this.insertQuoteText(data.quote);
			}
		}
		safeHide(this.options.warningWaitElementId);

		this.showControls();
	}

	BXCrmActivityEmail.prototype.insertQuoteText = function(quote)
	{
		const options = this.options;
		if (BX.type.isString(quote)
			&& BX.type.isString(options.formId)
			&& BX.type.isString(options.formQuoteFieldName)
			&& BX.type.isObject(BXMainMailForm)
			&& BX.type.isObject(BXMainMailForm.getForm(options.formId))
			&& BX.type.isArray(BXMainMailForm.getForm(options.formId).fields))
		{
			const fields = BXMainMailForm.getForm(options.formId).fields;
			for (const i in fields)
			{
				if (fields.hasOwnProperty(i))
				{
					if (BX.type.isObject(fields[i]) && fields[i].name === options.formQuoteFieldName)
					{
						fields[i].value = quote;
						break;
					}
				}
			}
		}
	};

	BXCrmActivityEmail.prototype.showError = function ()
	{
		safeHide(this.options.warningWaitElementId);
		safeShow(this.options.warningFailElementId);
	}

	BXCrmActivityEmail.prototype.startProgressTimer = function ()
	{
		const options = this.options;

		if (!options.bodyLoaderElementId || !options.bodyLoaderMaxTime)
		{
			return;
		}

		const progressContainer = document.getElementById(options.bodyLoaderElementId);
		if (!progressContainer)
		{
			return;
		}

		const myProgress = new BX.UI.ProgressBar({
			maxValue: 100,
			value: 0,
		});
		myProgress.renderTo(BX(options.bodyLoaderElementId));

		const stepTime = options.bodyLoaderMaxTime / 100 * 1000;

		this.progressInterval = setInterval(() =>
		{
			if (this.progressPercent >= 100)
			{
				this.stopProgress();
				this.progressPercent = 100;
			}
			else
			{
				this.progressPercent += 1;
			}
			myProgress.setValue(this.progressPercent);
			myProgress.update();
		}, stepTime);
	}

	BXCrmActivityEmail.prototype.stopProgress = function ()
	{
		clearInterval(this.progressInterval);
	}

	BXCrmActivityEmail.prototype.handleFailedResponse = function ()
	{
		this.stopProgress();
		this.showError();
		this.showControls();
	}

	BXCrmActivityEmail.prototype.showControls = function ()
	{
		safeShow(this.options.controlElementId);
		safeShow(this.options.replyElementId);
	}

	BXCrmActivityEmail.prototype.bindErrorClose = function ()
	{
		if (!this.options.warningFailElementId)
		{
			return;
		}
		const errorContainer = document.getElementById(this.options.warningFailElementId);
		if (!errorContainer)
		{
			return;
		}
		const closeElement = errorContainer.querySelector('.ui-alert-close-btn');
		if (!closeElement)
		{
			return;
		}
		BX.bind(closeElement, 'click', function ()
		{
			BX.hide(errorContainer);
		});
	}

	BXCrmActivityEmail.prototype.initAnalytics = function()
	{
		const analyticsSettings = this.options.analytics || {};
		const source = analyticsSettings.source || 'crm';
		const form = this.htmlForm;
		let currentCElement = analyticsSettings?.action;

		const setCElement = function(val)
		{
			currentCElement = val;
		};

		if (!(this.ctrl.options?.type === 'edit'))
		{
			currentCElement = 'fast_reply';

			BX.UI.Analytics.sendData({
				tool: 'mail',
				category: 'mail_operations',
				event: 'mail_view',
				type: 'mail',
				c_section: source,
			});
		}

		if (!form)
		{
			return;
		}

		let controls = document.getElementById(this.options.controlElementId);

		if (!controls && this.__wrapper)
		{
			controls = this.__wrapper.querySelector('.crm-task-list-mail-item-control-inner');
		}

		if (controls)
		{
			const replyBtn = controls.querySelector('.crm-task-list-mail-item-control-reply');
			const replyAllBtn = controls.querySelector('.crm-task-list-mail-item-control-icon-answertoall');

			if (replyBtn)
			{
				BX.bind(replyBtn, 'click', setCElement.bind(null, 'reply'));
			}

			if (replyAllBtn)
			{
				BX.bind(replyAllBtn, 'click', setCElement.bind(null, 'reply_all'));
			}
		}

		const sendButton = form.querySelector('.main-mail-form-submit-button');
		if (!sendButton)
		{
			return;
		}

		const sendAnalytics = function()
		{
			BX.UI.Analytics.sendData({
				tool: 'mail',
				category: 'mail_operations',
				event: 'mail_send',
				type: 'mail',
				c_section: source,
				c_element: currentCElement,
			});
		};

		BX.bind(sendButton, 'click', sendAnalytics.bind());
	};

	function safeHide(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element)
			{
				BX.hide(element);
			}
		}
	}

	function safeShow(elementId)
	{
		if (elementId)
		{
			const element = document.getElementById(elementId);
			if (element && element.style && element.style.display === 'none')
			{
				element.style.display = '';
			}
		}
	}

	window.BXCrmActivityEmailController = BXCrmActivityEmailController;
	window.BXCrmActivityEmail = BXCrmActivityEmail;

})();

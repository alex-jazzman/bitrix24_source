;(function()
{
	const namespace = BX.namespace('BX.Mail.MailboxList');
	if (namespace.Manager)
	{
		return;
	}

	const MAILBOX_CONFIG_SUCCESS = 'mail-mailbox-config-success';
	const MAILBOX_CONFIG_DELETE = 'mail-mailbox-config-delete';
	const MASSCONNECT_MAILBOXES_APPEND_SUCCESS = 'mail-massconnect-mailboxes-append-success';
	const MAILBOX_CONNECTION_REQUEST_COMPLETED_EVENT = 'mail-mailbox-connection-request-completed';

	const PASSWORDLESS_REQUESTS_SENT = 'mail-massconnect-passwordless-requests-sent';
	const HIGHLIGHT_CLASS = 'mailbox-grid_row-highlight';
	const GEAR_HIGHLIGHT_CLASS = 'mail-mailbox-list-gear-highlighter';
	const getSidePanelEventTarget = () => {
		if (window.top && window.top.BX && window?.top?.BX?.addCustomEvent)
		{
			return window.top.BX;
		}

		return BX;
	};

	class Manager
	{
		constructor(params)
		{
			this.gridId = params.gridId;
			this.needHighlightGearButton = Boolean(params.needHighlightGearButton);
			this.highlightGearButtonOptionName = params.highlightGearButtonOptionName || null;

			this.sliderMessageEvent = 'SidePanel.Slider:onMessage';
			this.sliderCloseCompleteEvent = 'SidePanel.Slider:onCloseComplete';
			this.gridUpdateEvent = 'Grid::updated';
			this.pullEventMailEvent = 'onPullEvent-mail';
			this.sidePanelEventTarget = getSidePanelEventTarget();
			this.handleSliderMessage = this.onSliderMessage.bind(this);
			this.handleSliderCloseComplete = this.onSliderCloseComplete.bind(this);
			this.handleGridUpdated = this.onGridUpdated.bind(this);
			this.handlePullEventMail = this.onPullEventMail.bind(this);

			this.reloadGridEventIds = [
				MAILBOX_CONFIG_SUCCESS,
				MAILBOX_CONFIG_DELETE,
				MASSCONNECT_MAILBOXES_APPEND_SUCCESS,
				MAILBOX_CONNECTION_REQUEST_COMPLETED_EVENT,
			];

			this.pendingHighlightMailboxId = null;
			this.pendingGearHighlight = false;

			if (params.resetFilterOnClose)
			{
				this.subscribeSliderClose();
			}

			this.bindEvents();
		}

		bindEvents()
		{
			this.sidePanelEventTarget.addCustomEvent(this.sliderMessageEvent, this.handleSliderMessage);
			this.sidePanelEventTarget.addCustomEvent(this.sliderCloseCompleteEvent, this.handleSliderCloseComplete);
			BX.addCustomEvent(this.gridUpdateEvent, this.handleGridUpdated);
			this.sidePanelEventTarget.addCustomEvent(this.pullEventMailEvent, this.handlePullEventMail);
		}

		onPullEventMail(command, params)
		{
			if (command === 'passwordless_sent_total_count_changed')
			{
				this.updateGearButtonCounter(params?.count ?? 0);

				return;
			}

			if (command !== 'connection_request_count_changed' && command !== 'connection_request_cancelled')
			{
				return;
			}

			this.scheduleGridReload();
		}

		scheduleGridReload()
		{
			if (this.pullReloadTimer)
			{
				clearTimeout(this.pullReloadTimer);
			}

			this.pullReloadTimer = setTimeout(() => {
				this.pullReloadTimer = null;
				const grid = BX.Main.gridManager.getInstanceById(this.gridId);
				if (grid)
				{
					grid.reload();
				}
			}, 500);
		}

		updateGearButtonCounter(count)
		{
			const gearCounter = document.querySelector('[data-id="mailboxGridGearButton"] .ui-counter');
			if (gearCounter)
			{
				if (count <= 0)
				{
					gearCounter.style.display = 'none';
				}
				else
				{
					gearCounter.style.display = '';
					gearCounter.dataset.value = count;
					const inner = gearCounter.querySelector('.ui-counter__value');
					if (inner)
					{
						inner.textContent = count;
					}
				}
			}

			const menuCounter = document.getElementById('mailbox-gear-menu-sent-counter');
			if (menuCounter)
			{
				if (count <= 0)
				{
					menuCounter.style.display = 'none';
				}
				else
				{
					menuCounter.style.display = '';
					const inner = menuCounter.querySelector('.ui-counter-inner');
					if (inner)
					{
						inner.textContent = count;
					}
				}
			}
		}

		onGridUpdated()
		{
			if (!this.pendingHighlightMailboxId)
			{
				return;
			}

			const mailboxId = this.pendingHighlightMailboxId;
			this.pendingHighlightMailboxId = null;

			setTimeout(() => {
				this.highlightRow(mailboxId);
			}, 100);
		}

		onSliderMessage(event)
		{
			if (event.getEventId() === PASSWORDLESS_REQUESTS_SENT)
			{
				if (!this.needHighlightGearButton)
				{
					return;
				}

				this.pendingGearHighlight = true;

				return;
			}

			if (!this.reloadGridEventIds.includes(event.getEventId()))
			{
				return;
			}

			if (event.getEventId() === MAILBOX_CONNECTION_REQUEST_COMPLETED_EVENT && event.data?.id)
			{
				this.pendingHighlightMailboxId = String(event.data.id);
			}

			const grid = BX.Main.gridManager.getInstanceById(this.gridId);
			if (grid)
			{
				grid.reload();
			}
		}

		highlightRow(mailboxId)
		{
			const gridData = BX.Main.gridManager.getById(this.gridId);
			if (!gridData)
			{
				return;
			}

			const grid = gridData.instance;
			const row = grid.getRows().getById(mailboxId);
			if (!row)
			{
				return;
			}

			const node = row.getNode();
			node.scrollIntoView({ behavior: 'smooth', block: 'center' });
			BX.addClass(node, HIGHLIGHT_CLASS);

			const firstCell = node.querySelector('td');
			if (firstCell)
			{
				BX.Event.bind(firstCell, 'animationend', () => {
					BX.removeClass(node, HIGHLIGHT_CLASS);
				}, { once: true });
			}
		}

		subscribeSliderClose()
		{
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				BX.addCustomEvent(slider, 'SidePanel.Slider:onClose', () => {
					this.resetFilter();
				});
			}
		}

		onSliderCloseComplete()
		{
			if (this.pendingGearHighlight)
			{
				this.pendingGearHighlight = false;
				setTimeout(() => {
					this.highlightGearButton();
				}, 150);
			}
		}

		highlightGearButton()
		{
			const gearButton = document.querySelector('[data-id="mailboxGridGearButton"]');
			if (!gearButton)
			{
				return;
			}

			const currentHighlighter = gearButton.querySelector(`.${GEAR_HIGHLIGHT_CLASS}`);
			if (currentHighlighter)
			{
				BX.Dom.remove(currentHighlighter);
			}

			const highlighter = BX.Tag.render`<span class="ui-highlighter --with-glow --success --border-md --glow-md ${GEAR_HIGHLIGHT_CLASS}"></span>`;
			BX.Dom.style(highlighter, '--ui-highlighter-radius', '8px');
			BX.Dom.style(highlighter, '--ui-highlighter-animation-duration', '1.5s');
			BX.Dom.append(highlighter, gearButton);

			const totalDuration = 1.5 * 2 + 0.5;
			setTimeout(() => {
				if (highlighter.parentNode)
				{
					BX.Dom.remove(highlighter);
				}
			}, totalDuration * 1000);

			this.markGearHighlightShown();
		}

		markGearHighlightShown()
		{
			if (!this.needHighlightGearButton || !this.highlightGearButtonOptionName)
			{
				return;
			}

			this.needHighlightGearButton = false;
			BX.userOptions.save('mail.guide', this.highlightGearButtonOptionName, null, 'Y');
		}

		resetFilter()
		{
			const filter = BX.Main.filterManager.getById(this.gridId);
			if (filter)
			{
				filter.resetFilter();
			}
		}

		unbindEvents()
		{
			this.sidePanelEventTarget.removeCustomEvent(this.sliderMessageEvent, this.handleSliderMessage);
			this.sidePanelEventTarget.removeCustomEvent(this.sliderCloseCompleteEvent, this.handleSliderCloseComplete);
			BX.removeCustomEvent(this.gridUpdateEvent, this.handleGridUpdated);
			this.sidePanelEventTarget.removeCustomEvent(this.pullEventMailEvent, this.handlePullEventMail);
		}

		destroy()
		{
			this.unbindEvents();
		}
	}

	const LimitHelpers = {
		showLimitSlider(code)
		{
			const activeFeaturePromoter = BX.UI.FeaturePromotersRegistry.getPromoter({
				code,
			});
			activeFeaturePromoter.show();
		},
	};

	namespace.Manager = Manager;
	namespace.LimitHelpers = LimitHelpers;
})();

import { Dom, Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { Util, CallCommonRecordState } from 'call.core';
import { createCssTooltip } from './helpers/create-css-tooltip';

export class RecordStatusButton
{
	constructor(config)
	{
		this.userId = config.userId;
		this.commonRecordState = config.commonRecordState;

		this.updateViewInterval = null;

		this.tooltip = createCssTooltip(Type.isPlainObject(config.tooltip) ? config.tooltip : {});

		this.elements = {
			root: null,
			timeText: null,
			stateText: null,
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const { tooltipStyle } = this.tooltip;

		this.elements.root = Dom.create('div', {
			props: {
				className: `bx-messenger-videocall-top-recordstatus record-status-${this.commonRecordState.state}`,
			},
			attrs: {
				style: tooltipStyle,
			},
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-recordstatus-status' },
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-top-button-icon record-status' },
						}),
					],
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-recordstatus-time' },
					children: [
						(this.elements.timeText = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-top-recordstatus-time-text' },
							attrs: { 'aria-hidden': 'true' },
							text: Util.getRecordTimeText(this.commonRecordState),
						})),
					],
				}),
			],
		});

		this.applyStatusA11y(this.commonRecordState.state);

		return this.elements.root;
	}

	update(commonRecordState)
	{
		const prevState = this.commonRecordState?.state;

		if (prevState !== commonRecordState.state)
		{
			clearInterval(this.updateViewInterval);
			this.updateViewInterval = null;

			if (commonRecordState.state === CallCommonRecordState.Started)
			{
				this.updateViewInterval = setInterval(() => this.updateView(), 1000);
			}

			this.announceStateChange(commonRecordState.state);
			this.applyStatusA11y(commonRecordState.state);
		}

		this.commonRecordState = commonRecordState;
		this.updateView();
	}

	announceStateChange(state)
	{
		// Build the map lazily: CallCommonRecordState (call.core) is not yet
		// initialized at module-eval time, so referencing it at top level throws.
		const messageKey = {
			[CallCommonRecordState.Started]: 'CALL_VIEW_RECORD_ANNOUNCE_STARTED',
			[CallCommonRecordState.Resumed]: 'CALL_VIEW_RECORD_ANNOUNCE_RESUMED',
			[CallCommonRecordState.Paused]: 'CALL_VIEW_RECORD_ANNOUNCE_PAUSED',
			[CallCommonRecordState.Stopped]: 'CALL_VIEW_RECORD_ANNOUNCE_STOPPED',
		}[state];

		if (!messageKey)
		{
			return;
		}

		const phrase = Loc.getMessage(messageKey);
		if (!phrase)
		{
			return;
		}

		// nothing the call window announces interrupts the screen reader: "call ended"
		// and "connection lost" do not reach this live region at all
		LiveAnnouncer.announce(phrase, 'polite');
	}

	getStatusAriaLabel(state)
	{
		return {
			[CallCommonRecordState.Started]: Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE'),
			[CallCommonRecordState.Resumed]: Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE'),
			[CallCommonRecordState.Paused]: Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_PAUSED'),
		}[state] || '';
	}

	applyStatusA11y(state)
	{
		// role="img" (not role="status"): a live region here would double-announce with LiveAnnouncer.
		const label = this.getStatusAriaLabel(state);
		if (label)
		{
			Dom.attr(this.elements.root, { role: 'img', 'aria-label': label });
		}
		else
		{
			Dom.attr(this.elements.root, 'role', null);
			Dom.attr(this.elements.root, 'aria-label', null);
		}
	}

	updateView()
	{
		const timeText = Util.getRecordTimeText(this.commonRecordState);

		if (this.elements.timeText.innerText !== timeText)
		{
			this.elements.timeText.innerText = timeText;
		}

		const currentClass = `record-status-${this.commonRecordState.state}`;
		if (!Dom.hasClass(this.elements.root, currentClass))
		{
			const { tooltipClass, hasTooltip, tooltipTextVarName, getTooltipText } = this.tooltip;
			const tooltipText = getTooltipText();

			if (hasTooltip && tooltipText)
			{
				Dom.style(this.elements.root, tooltipTextVarName, `'${tooltipText}'`);
			}

			const classes = [
				tooltipText ? tooltipClass : '',
				'bx-messenger-videocall-top-recordstatus',
				currentClass,
			].filter(Boolean);

			this.elements.root.className = classes.join(' ');
		}
	}

	stopViewUpdate()
	{
		if (this.updateViewInterval)
		{
			clearInterval(this.updateViewInterval);
			this.updateViewInterval = null;
		}
	}
}

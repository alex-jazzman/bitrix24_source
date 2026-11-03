import { EventEmitter } from 'main.core.events';
import { EventType } from 'sale.checkout.const';
import { FocusTrap, InteractivityChecker } from 'ui.a11y';

import { whenShutterVisible } from './focus';

let dialogSequence = 0;

/**
 * Focus trap, isolation and scroll lock of a row layer, kept together so a refused opening cannot lock the page.
 * The host marks the wrapper with `ref="dialog"` and lists its initiator selectors in `dialogInitiator`.
 */
export const MixinItemDialog = {
	props: ['index', 'opened'],
	computed:
	{
		dialogHeadingId()
		{
			return `sale-checkout-item-dialog-heading-${this.dialogSequenceNumber}`;
		},
	},
	watch:
	{
		opened(opened)
		{
			if (opened)
			{
				document.body.style.overflowY = 'hidden';

				// the wrapper is still inert at this point, and nothing inside it can take focus
				this.$nextTick(() => this.openDialog());

				return;
			}

			this.closeDialog();
		},
	},
	created()
	{
		dialogSequence++;
		this.dialogSequenceNumber = dialogSequence;
		this.focusTrap = null;
		this.cancelShutterWait = null;
	},
	beforeDestroy()
	{
		if (this.opened)
		{
			this.closeDialog();
		}

		this.cancelShutterWait?.();
		this.focusTrap?.destroy();
		this.focusTrap = null;
	},
	methods:
	{
		openDialog()
		{
			if (!this.opened || !this.$refs.dialog)
			{
				return;
			}

			if (this.focusTrap === null)
			{
				this.focusTrap = new FocusTrap(this.$refs.dialog, {
					isolateOutside: true,
					restoreFocus: () => this.getDialogInitiator(),
				});
			}

			// nothing inside the layer can take focus while its shutter is still transparent
			this.cancelShutterWait = whenShutterVisible(
				this.$refs.dialog,
				() => this.focusTrap.activate({ initialFocus: true }),
			);
		},
		/**
		 * Runs from the watcher, not $nextTick: the trap lets the focus go before the wrapper turns inert.
		 */
		closeDialog()
		{
			this.cancelShutterWait?.();
			this.cancelShutterWait = null;
			this.focusTrap?.deactivate();
			document.body.style.overflowY = '';
		},
		requestDialogClose()
		{
			EventEmitter.emit(EventType.basket.backdropClose, { index: this.index });
		},
		getDialogInitiator()
		{
			const row = this.$el.closest('.checkout-basket-item');

			if (!row)
			{
				return null;
			}

			const initiator = this.dialogInitiator
				.map((selector) => row.querySelector(selector))
				.find((node) => node !== null && InteractivityChecker.isFocusable(node));

			return initiator ?? null;
		},
	},
};

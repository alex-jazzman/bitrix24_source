/**
 * @module im/messenger/controller/dialog/lib/text-field/src/const/send-button
 */
jn.define('im/messenger/controller/dialog/lib/text-field/src/const/send-button', (require, exports, module) => {
	const { Icon } = require('assets/icons');

	/**
	 * Send button v2 (native feature 'chat_send_button_v2') state models. Passed to the
	 * dialog widget at open time as `textField.sendButton: { disabled, filled, edit, stop }`.
	 * The native side renders only the states delivered on open, so all four are provided;
	 * `setSendButtonState` then just switches between them.
	 *
	 * Design tokens are the BitrixGPT brand set: empty input — outline gradient
	 * ('outline-bitrix-gpt'), filled/edit/stop — solid gradient ('filled-bitrix-gpt').
	 * Native tints the (single-path) icon to a contrasting color for the given design, so no
	 * explicit icon color is needed. The `disabled` state intentionally carries NO `disabled`
	 * flag: that flag makes the native DSButton paint the grey system-disabled look and drop
	 * the gradient — the empty-input state must stay an outline-gradient button.
	 *
	 * SendButtonModel / SendButtonStateId are declared in
	 * im/messenger/view/dialog/types/text-field.d.ts.
	 */

	const SendButtonHeight = 'L';

	/** @type {SendButtonModel} */
	const DisabledSendButton = {
		id: 'disabled',
		iconName: Icon.ARROW_TOP.getIconName(),
		height: SendButtonHeight,
		design: 'outline-bitrix-gpt',
	};

	/** @type {SendButtonModel} */
	const FilledSendButton = {
		id: 'filled',
		iconName: Icon.ARROW_TOP.getIconName(),
		height: SendButtonHeight,
		design: 'filled-bitrix-gpt',
	};

	/** @type {SendButtonModel} */
	const EditSendButton = {
		id: 'edit',
		iconName: Icon.CHECK.getIconName(),
		height: SendButtonHeight,
		design: 'filled-bitrix-gpt',
	};

	/** @type {SendButtonModel} */
	const StopSendButton = {
		id: 'stop',
		iconName: Icon.STOP.getIconName(),
		height: SendButtonHeight,
		design: 'filled-bitrix-gpt',
	};

	/**
	 * @desc Builds the full send button v2 configuration for the dialog widget settings.
	 * @return {{ disabled: SendButtonModel, filled: SendButtonModel, edit: SendButtonModel, stop: SendButtonModel }}
	 */
	function getSendButtonConfig()
	{
		return {
			disabled: DisabledSendButton,
			filled: FilledSendButton,
			edit: EditSendButton,
			stop: StopSendButton,
		};
	}

	module.exports = {
		getSendButtonConfig,
	};
});

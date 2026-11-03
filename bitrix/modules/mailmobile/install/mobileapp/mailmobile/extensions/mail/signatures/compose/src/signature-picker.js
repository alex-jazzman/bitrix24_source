/**
 * @module mail/signatures/compose/src/signature-picker
 */
jn.define('mail/signatures/compose/src/signature-picker', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { PopupMenu } = require('ui-system/popups/popup-menu');

	class SignaturePicker
	{
		static buildItems({
			signatures,
			selectedSignatureId,
			withoutSignatureText,
			createText,
			onSelect,
			onClear,
			onCreate,
		})
		{
			const signatureItems = signatures.map((signature) => ({
				id: `signature-${signature.id}`,
				testId: `mail-compose-signature-option-${signature.id}`,
				title: SignaturePicker.getPreview(signature.text),
				checked: Number(signature.id) === Number(selectedSignatureId),
				onItemSelected: () => onSelect(signature),
			}));
			return [
				...signatureItems,
				{
					id: 'without-signature',
					testId: 'mail-compose-signature-none',
					title: withoutSignatureText,
					checked: selectedSignatureId === null,
					onItemSelected: onClear,
				},
				{
					id: 'create-signature',
					testId: 'mail-compose-signature-create',
					title: createText,
					icon: Icon.PLUS,
					onItemSelected: onCreate,
				},
			];
		}

		static show({
			target,
			signatures,
			selectedSignatureId,
			withoutSignatureText,
			createText,
			onSelect,
			onClear,
			onCreate,
		})
		{
			const menu = new PopupMenu(SignaturePicker.buildItems({
				signatures,
				selectedSignatureId,
				withoutSignatureText,
				createText,
				onSelect,
				onClear,
				onCreate,
			}));

			menu.show({ target });
		}

		static getPreview(text)
		{
			const preview = String(text ?? '').replace(/\s+/g, ' ').trim();

			return preview.length > 80 ? `${preview.slice(0, 77)}...` : preview;
		}
	}

	module.exports = { SignaturePicker };
});

/**
 * @module mail/signatures/compose/src/compose-signature-state
 */
jn.define('mail/signatures/compose/src/compose-signature-state', (require, exports, module) => {
	const SIGNATURE_SEPARATOR = '\n--\n';

	class ComposeSignatureState
	{
		constructor(signature = null, { restoredDraft = false } = {})
		{
			this.automaticTransitionsEnabled = !restoredDraft;
			this.clear();
			if (signature && this.automaticTransitionsEnabled)
			{
				this.apply(signature);
			}
		}

		apply(signature)
		{
			if (!signature || Number(signature.id) <= 0 || typeof signature.text !== 'string')
			{
				return false;
			}

			this.selectedSignatureId = Number(signature.id);
			this.originalText = signature.text;
			this.text = signature.text;
			this.isDirty = false;
			this.isEnabled = true;

			return true;
		}

		transition(signature)
		{
			if (!this.automaticTransitionsEnabled || !signature)
			{
				return false;
			}

			return this.apply(signature);
		}

		select(signature)
		{
			this.automaticTransitionsEnabled = true;

			return this.apply(signature);
		}

		clearExplicitly()
		{
			this.automaticTransitionsEnabled = true;
			this.clear();
		}

		edit(text)
		{
			this.text = String(text ?? '');
			this.isDirty = this.text !== this.originalText;
		}

		clear()
		{
			this.selectedSignatureId = null;
			this.originalText = '';
			this.text = '';
			this.isDirty = false;
			this.isEnabled = false;
		}

		serialize(body)
		{
			const message = String(body ?? '');

			return this.isEnabled && this.text.trim() !== ''
				? `${message}${SIGNATURE_SEPARATOR}${this.text}`
				: message
			;
		}
	}

	module.exports = { ComposeSignatureState, SIGNATURE_SEPARATOR };
});

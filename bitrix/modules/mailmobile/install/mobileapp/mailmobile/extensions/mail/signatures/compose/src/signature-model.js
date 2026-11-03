/**
 * @module mail/signatures/compose/src/signature-model
 */
jn.define('mail/signatures/compose/src/signature-model', (require, exports, module) => {
	class SignatureModel
	{
		/**
		 * @param {MobileSignatureContext} context
		 */
		constructor(context = {})
		{
			this.updateContext(context);
		}

		/**
		 * @param {MobileSignatureContext} context
		 */
		updateContext(context = {})
		{
			const signatures = Array.isArray(context.signatures) ? context.signatures : [];
			const senders = Array.isArray(context.senders) ? context.senders : [];

			this.signatures = signatures.filter((item) => Number(item?.id) > 0);
			this.senders = senders.filter((item) => typeof item?.key === 'string' && item.key !== '');
			this.signaturesById = new Map(this.signatures.map((item) => [Number(item.id), item]));
			this.sendersByKey = new Map(this.senders.map((item) => [item.key, item]));
		}

		getOwnerSignatures()
		{
			return this.signatures.filter((item) => item.scope === 'owner');
		}

		getAvailableSignatures(senderKey)
		{
			const sender = this.findSender(senderKey);
			if (!sender)
			{
				return [];
			}

			const ids = new Set(Array.isArray(sender.availableSignatureIds) ? sender.availableSignatureIds.map(Number) : []);

			return this.signatures
				.filter((item) => ids.has(Number(item.id)))
				.map((item) => this.resolveSignature(item.id, senderKey))
			;
		}

		findSignature(id)
		{
			return this.signaturesById.get(Number(id)) ?? null;
		}

		resolveSignature(id, senderKey)
		{
			const signature = this.findSignature(id);
			const senderText = signature?.senderTexts?.[senderKey];
			if (typeof senderText !== 'string')
			{
				return signature;
			}

			return { ...signature, text: senderText };
		}

		findSender(senderKey)
		{
			return this.sendersByKey.get(senderKey) ?? null;
		}

		addOwner(item)
		{
			if (!item || item.scope !== 'owner' || Number(item.id) <= 0)
			{
				return;
			}

			this.signatures = [
				...this.signatures.filter((signature) => Number(signature.id) !== Number(item.id)),
				item,
			];
			this.signaturesById.set(Number(item.id), item);
			const itemSenderKeys = new Set(
				Array.isArray(item.senderKeys)
					? item.senderKeys
					: (item.senderKey ? [item.senderKey] : []),
			);
			this.senders = this.senders.map((sender) => {
				if (itemSenderKeys.size > 0 && !itemSenderKeys.has(sender.key))
				{
					return sender;
				}

				const availableSignatureIds = Array.from(new Set([
					...(Array.isArray(sender.availableSignatureIds) ? sender.availableSignatureIds.map(Number) : []),
					Number(item.id),
				]));

				return { ...sender, availableSignatureIds };
			});
			this.sendersByKey = new Map(this.senders.map((sender) => [sender.key, sender]));
		}

		setSelectedSignature(senderKey, signatureId)
		{
			const sender = this.findSender(senderKey);
			if (!sender)
			{
				return false;
			}

			const updatedSender = {
				...sender,
				selectedSignatureId: signatureId === null ? null : Number(signatureId),
			};
			this.senders = this.senders.map((item) => item.key === senderKey ? updatedSender : item);
			this.sendersByKey.set(senderKey, updatedSender);

			return true;
		}

		removeOwner(id)
		{
			const item = this.findSignature(id);
			if (!item || item.scope !== 'owner')
			{
				return false;
			}

			this.signatures = this.signatures.filter((signature) => Number(signature.id) !== Number(id));
			this.signaturesById.delete(Number(id));
			this.senders = this.senders.map((sender) => ({
				...sender,
				availableSignatureIds: (sender.availableSignatureIds ?? [])
					.map(Number)
					.filter((signatureId) => signatureId !== Number(id)),
				selectedSignatureId: Number(sender.selectedSignatureId) === Number(id)
					? null
					: sender.selectedSignatureId,
			}));
			this.sendersByKey = new Map(this.senders.map((sender) => [sender.key, sender]));

			return true;
		}
	}

	module.exports = { SignatureModel };
});

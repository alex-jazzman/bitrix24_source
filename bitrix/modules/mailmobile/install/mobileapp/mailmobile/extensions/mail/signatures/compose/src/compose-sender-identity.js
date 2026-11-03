/**
 * @module mail/signatures/compose/src/compose-sender-identity
 */
jn.define('mail/signatures/compose/src/compose-sender-identity', (require, exports, module) => {
	const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('en');

	class ComposeSenderIdentity
	{
		constructor(senders = [], signatureSenders = [])
		{
			const usedSenderKeys = new Set();
			this.entries = senders.map((sender, index) => {
				const email = String(sender.email ?? sender.value ?? '').trim();
				const name = String(sender.name ?? sender.title ?? email).trim();
				const candidates = signatureSenders.filter((item) => normalize(item.email) === normalize(email));
				const signatureSender = candidates.find((item) => (
					normalize(item.name) === normalize(name) && !usedSenderKeys.has(item.key)
				)) ?? (candidates.length === 1 && !usedSenderKeys.has(candidates[0].key) ? candidates[0] : null)
				;
				if (signatureSender)
				{
					usedSenderKeys.add(signatureSender.key);
				}
				const menuId = signatureSender
					? `signature-sender:${signatureSender.key}`
					: `legacy-sender:${index}`
				;

				return {
					menuId,
					email,
					name,
					senderKey: signatureSender?.key ?? null,
					raw: sender,
				};
			});
			this.entriesByMenuId = new Map(this.entries.map((entry) => [entry.menuId, entry]));
		}

		resolve(menuId)
		{
			return this.entriesByMenuId.get(menuId) ?? null;
		}

		findMenuId(value, name = null)
		{
			if (this.entriesByMenuId.has(value))
			{
				return value;
			}

			const candidates = this.entries.filter((entry) => normalize(entry.email) === normalize(value));
			if (name !== null)
			{
				const namedEntry = candidates.find((entry) => normalize(entry.name) === normalize(name));
				if (namedEntry)
				{
					return namedEntry.menuId;
				}
			}

			return candidates[0]?.menuId ?? null;
		}

		remapMenuId(previousIdentity, menuId)
		{
			const previousEntry = previousIdentity?.resolve(menuId);
			if (!previousEntry)
			{
				return this.findMenuId(menuId);
			}

			return this.findMenuId(previousEntry.email, previousEntry.name);
		}

		getMenuItems(icon)
		{
			return this.entries.map((entry) => ({
				id: entry.menuId,
				title: entry.name || entry.email,
				subtitle: entry.email,
				icon,
			}));
		}

		toTransportEmail(menuId)
		{
			return this.resolve(menuId)?.email ?? null;
		}

		reorderForTransport(menuId)
		{
			const selected = this.resolve(menuId);
			if (!selected)
			{
				return this.entries.map((entry) => entry.raw);
			}

			return [
				selected.raw,
				...this.entries.filter((entry) => entry !== selected).map((entry) => entry.raw),
			];
		}
	}

	module.exports = { ComposeSenderIdentity };
});

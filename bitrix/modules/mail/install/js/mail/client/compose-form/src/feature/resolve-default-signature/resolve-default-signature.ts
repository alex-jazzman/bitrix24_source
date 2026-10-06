import { Text, Type } from 'main.core';

import { Api } from '../../infrastructure/service/compose/compose';
import { buildSignatures } from '../../model/compose/compose';
import { type SenderDto, type SignatureItem, type SignaturesState } from '../../model/compose/types';

/**
 * The option is shared with the old form; `CUserOptions` merges it key by key, so writing one sender leaves
 * the choices of the other senders alone.
 */
const ChoiceOption = Object.freeze({
	category: 'mail',
	name: 'signature_choice',
});

/** `BX.userOptions` has no typings, so only the used method is declared. */
type UserOptionsGlobal = {
	userOptions: {
		save(category: string, name: string, valueName: string | null, value: string): void,
	},
};

/** Stored as "<signatureId>:<unixtime>". */
type SignatureChoice = {
	id: number,
	time: number,
};

/** Matches an entry of the choices dictionary of the state. */
export type SignatureChoiceRecord = {
	senderKey: string,
	value: string,
};

/**
 * Repeats `AssignmentResolver::normalizeSenderKey` of the server: trailing spaces stripped, lower case. A
 * client that normalises otherwise resolves another default signature than the server does.
 */
export function normalizeSenderKey(value: string): string
{
	return Type.isStringFilled(value) ? value.replace(/ +$/, '').toLowerCase() : '';
}

/**
 * The key cascade repeats the one of the server: "Name <address>", then the bare address, then the signatures
 * bound to no sender at all. The keys are compared normalised, and a key met twice is taken once.
 */
export function collectSignatures(
	bySender: Record<string, SignatureItem[]>,
	sender: SenderDto,
): SignatureItem[]
{
	const byKey: Record<string, SignatureItem[]> = {};
	Object.keys(bySender).forEach((rawKey) => {
		const key = normalizeSenderKey(rawKey);
		byKey[key] = [...(byKey[key] ?? []), ...(bySender[rawKey] ?? [])];
	});

	return [normalizeSenderKey(sender.formated), normalizeSenderKey(sender.email), '']
		.filter((key, index, keys) => keys.indexOf(key) === index)
		.flatMap((key) => byKey[key] ?? []);
}

/**
 * The remembered choice wins over an assigned shared signature only when the choice was made later than the
 * assignment; an assignment with an unknown moment wins, as there is nothing to weigh the choice against.
 * Otherwise the order is the shared signature, then the first personal one. A signature with an empty body
 * takes part in nothing here.
 */
export function resolveDefaultSignature(
	list: SignatureItem[],
	choices: Record<string, string>,
	sender: SenderDto,
): number | null
{
	const signatures = list.filter((item) => item.full !== '');
	const shared = signatures.find((item) => item.isShared) ?? null;
	const own = signatures.find((item) => !item.isShared) ?? null;
	const choice = parseChoice(
		choices[normalizeSenderKey(sender.formated)] ?? choices[normalizeSenderKey(sender.email)],
	);
	const assignedAt = shared?.assignedAt ?? 0;

	if (
		choice
		&& signatures.some((item) => item.signatureId === choice.id)
		&& (!shared || (assignedAt > 0 && choice.time > assignedAt))
	)
	{
		return choice.id;
	}

	return shared?.signatureId ?? own?.signatureId ?? null;
}

/**
 * Returns the record just written, so the caller keeps the choices of the state in step with the store: a
 * sender switched back and forth has to resolve against the fresh choice.
 */
export function rememberSignatureChoice(sender: SenderDto, signatureId: number): SignatureChoiceRecord | null
{
	const senderKey = buildChoiceKey(sender);
	if (signatureId <= 0 || senderKey === '')
	{
		return null;
	}

	const value = `${signatureId}:${Math.floor(Date.now() / 1000)}`;

	(BX as unknown as UserOptionsGlobal).userOptions.save(
		ChoiceOption.category,
		ChoiceOption.name,
		senderKey,
		value,
	);

	return { senderKey, value };
}

/** The response carries no settings path, so it travels through into the rebuilt state. */
export function loadSignatures(settingsPath: string): Promise<SignaturesState>
{
	return Api.getSignatures().then((response) => buildSignatures({
		bySender: response.data?.bySender,
		choices: response.data?.choices,
		settingsPath,
	}));
}

/**
 * Built as `SignatureChoiceStorage::buildSenderKey()` builds it. The `formated` value of the list is not the
 * key: the server writes it as "<address>" for a sender with no name, while the key is the bare address.
 */
function buildChoiceKey(sender: SenderDto): string
{
	const email = sender.email.trim();
	const name = sender.name.trim();

	return normalizeSenderKey(name !== '' && email !== '' ? `${name} <${email}>` : email);
}

/**
 * A value that names no signature is no choice at all, and a missing moment becomes `0`, which loses to any
 * assignment.
 */
function parseChoice(raw: string | undefined): SignatureChoice | null
{
	if (!Type.isStringFilled(raw))
	{
		return null;
	}

	const [rawId, rawTime] = raw.split(':');
	const id = Text.toInteger(rawId);
	const time = Text.toInteger(rawTime);

	return id > 0 ? { id, time: time > 0 ? time : 0 } : null;
}

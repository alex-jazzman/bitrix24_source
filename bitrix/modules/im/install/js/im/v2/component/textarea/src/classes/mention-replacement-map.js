import { Utils } from 'im.v2.lib.utils';

type MentionTextToInsert = string;
export type MentionReplacements = {[textToReplace: string]: MentionTextToInsert};

const CHAT_MENTION_CODE = 'chat';

export class MentionReplacementMap
{
	#replacements: MentionReplacements = {};
	#mentionTextByUserId: Map<string, string> = new Map();

	set(map: MentionReplacements): void
	{
		this.#replacements = map;
		this.#mentionTextByUserId.clear();
	}

	add(
		textToReplace: string,
		textToInsert: string,
		mentionedUserId: string | number | null = null,
	): MentionReplacements
	{
		this.#replacements[textToReplace] = textToInsert;

		if (mentionedUserId)
		{
			this.#mentionTextByUserId.set(mentionedUserId.toString(), textToReplace);
		}

		return this.#replacements;
	}

	hasMentionOfUser(text: string, userId: string | number): boolean
	{
		const mentionText = this.#mentionTextByUserId.get(userId.toString());

		return Boolean(mentionText) && text.includes(mentionText);
	}

	getAll(): MentionReplacements
	{
		return { ...this.#replacements };
	}

	apply(text: string): string
	{
		let resultText = text;
		Object.entries(this.#replacements).forEach(([textToReplace, textToInsert]) => {
			resultText = resultText.replaceAll(textToReplace, textToInsert);
		});

		return resultText;
	}

	extract(text: string): MentionReplacements
	{
		const mentions = {};
		const mentionRegExp = /\[(?<type>user|chat)=(?<dialogId>\w+)](?<mentionText>.*?)\[\/(user|chat)]/gi;

		const matches = text.matchAll(mentionRegExp);
		for (const match of matches)
		{
			const { mentionText } = match.groups;
			let { type: mentionType, dialogId } = match.groups;

			mentionType = mentionType.toLowerCase();
			if (mentionType === CHAT_MENTION_CODE)
			{
				dialogId = `${mentionType}${dialogId}`;
			}

			mentions[mentionText] = Utils.text.getMentionBbCode(dialogId, mentionText);
		}

		return mentions;
	}

	clear(): void
	{
		this.#replacements = {};
		this.#mentionTextByUserId.clear();
	}
}

type AvailablePhrases = 'hintText' | 'createText' | 'removeText' | 'warningText';

export class AbstractSelectorDictionary
{
	phrases: Record<AvailablePhrases, { team: string, default: string }> = {};

	getPhrase(key: AvailablePhrases, isTeamEntity: boolean): string
	{
		const phraseSet = this.phrases[key];

		if (!phraseSet)
		{
			throw new Error(`Phrase set for key "${key}" is not defined in ${this.constructor.name} selector dictionary.`);
		}

		return isTeamEntity ? phraseSet.team : phraseSet.default;
	}

	getEntityName(): string
	{
		return 'im-chat-only';
	}

	getTagId(chat): string | number
	{
		return `chat${chat.id}`;
	}

	getItemId(tag): string | number
	{
		return Number(tag.id.replace('chat', ''));
	}

	getEntity(): Object {}

	getDialogEvents(): Object
	{
		return {};
	}

	getTestId(blueprint: string): string {}

	getRemovePhrase(hasCurrentUser: boolean, isTeamEntity: boolean): string
	{
		throw new Error('getRemovePhrase must be implemented in inheritor');
	}
}

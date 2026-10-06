import { Loc } from 'main.core';

const PHRASE_PREFIX = 'UI_BUTTONS_';

// Unit tests run in a browser, so lang/<lang>/config.php cannot be read from the file system.
// Phrases are mirrored from ui/install/js/ui/buttons/lang/<lang>/config.php. Keep the mirror in
// sync with that file: it is checked by the "Should mirror the extension lang file" test case.
const messages = {
	en: {
		UI_BUTTONS_SAVE_BTN_TEXT: 'Save',
		UI_BUTTONS_CREATE_BTN_TEXT: 'Create',
		UI_BUTTONS_ADD_BTN_TEXT: 'Add',
		UI_BUTTONS_SEND_BTN_TEXT: 'Send',
		UI_BUTTONS_CANCEL_BTN_TEXT: 'Cancel',
		UI_BUTTONS_CLOSE_BTN_TEXT: 'Close',
		UI_BUTTONS_APPLY_BTN_TEXT: 'Apply',
	},
};

// The test page loads the extension with its lang file (Extension::load in mocha-wrapper.php),
// so the real phrases are in Loc before a test replaces them by the mirror above.
const langFilePhrases = readLangFilePhrases();

function readLangFilePhrases(): Object
{
	const phrases = {};
	const loaded = window.BX?.message;
	if (!loaded)
	{
		return phrases;
	}

	Object.keys(loaded)
		.filter((code) => code.startsWith(PHRASE_PREFIX))
		.forEach((code) => {
			phrases[code] = loaded[code];
		});

	return phrases;
}

export function getLangFilePhrases(): Object
{
	return { ...langFilePhrases };
}

export function getMirroredPhrases(lang: string = 'en'): Object
{
	return { ...messages[lang] };
}

export function getPageLanguage(): string
{
	return window.BX?.message?.LANGUAGE_ID ?? '';
}

export default function loadMessages(lang: string = 'en'): void
{
	const phrases = messages[lang];
	if (!phrases)
	{
		throw new Error(`loadMessages: the "${lang}" language is not available in tests`);
	}

	Loc.setMessage(phrases);
}

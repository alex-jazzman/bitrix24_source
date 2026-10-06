import { MARKDOWN_TABLE_PATTERN } from '../markdown/const.js';

export const NestedTagHandler = {
	putReplacement: [],
	sendReplacement: [],
	codeReplacement: [],
	tableReplacement: [],
	nonce: '',

	clean()
	{
		this.putReplacement = [];
		this.sendReplacement = [];
		this.codeReplacement = [];
		this.tableReplacement = [];
		this.nonce = '';
	},

	// Unpredictable per-render token mixed into the [code]/[table] placeholders. The
	// placeholder format used to be guessable (####REPLACEMENT_CODE_0####), so a sender
	// could paste many literal copies plus one real [code]/[table] and have the single
	// stored block replicated into every copy on recover — a client-side DOM-bloat DoS.
	// With a random nonce the sender cannot predict the recipient's placeholder, so the
	// recover only ever hits the one position the cut actually created. (Not a secret —
	// Math.random is enough to be unguessable by a remote sender; cleared per pass.)
	getNonce()
	{
		if (!this.nonce)
		{
			this.nonce = Math.random().toString(36).slice(2, 12);
		}

		return this.nonce;
	},

	cutPutTag(text: string): string
	{
		return text.replaceAll(/\[put(?:=(.+?))?](.+?)?\[\/put]/gi, (whole) => {
			const id = this.putReplacement.length;
			this.putReplacement.push(whole);

			return `####REPLACEMENT_PUT_${id}####`;
		});
	},

	recoverPutTag(text: string): string
	{
		this.putReplacement.forEach((value, index) => {
			text = text.split(`####REPLACEMENT_PUT_${index}####`).join(value);
		});

		return text;
	},

	cutSendTag(text: string): string
	{
		text = text.replaceAll(/\[send(?:=(.+?))?](.+?)?\[\/send]/gi, (whole) => {
			const id = this.sendReplacement.length;
			this.sendReplacement.push(whole);

			return `####REPLACEMENT_SEND_${id}####`;
		});

		return text;
	},

	recoverSendTag(text: string): string
	{
		this.sendReplacement.forEach((value, index) => {
			const placeholder = `####REPLACEMENT_SEND_${index}####`;
			text = text.split(placeholder).join(value);
		});

		return text;
	},

	cutCodeTag(text: string): string
	{
		const nonce = this.getNonce();
		text = text.replaceAll(/\[code](<br \/>)?(.*?)\[\/code]/gis, (whole) => {
			const id = this.codeReplacement.length;
			this.codeReplacement.push(whole);

			return `####REPLACEMENT_CODE_${nonce}_${id}####`;
		});

		return text;
	},

	recoverCodeTag(text: string): string
	{
		const nonce = this.getNonce();
		this.codeReplacement.forEach((value, index) => {
			text = text.split(`####REPLACEMENT_CODE_${nonce}_${index}####`).join(value);
		});

		this.sendReplacement.forEach((value, index) => {
			text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
		});

		return text;
	},

	cutTableTag(text: string): string
	{
		const nonce = this.getNonce();

		return text.replaceAll(MARKDOWN_TABLE_PATTERN, (whole) => {
			const id = this.tableReplacement.length;
			this.tableReplacement.push(whole);

			return `####REPLACEMENT_TABLE_${nonce}_${id}####`;
		});
	},

	recoverTableTag(text: string): string
	{
		const nonce = this.getNonce();
		this.tableReplacement.forEach((value, index) => {
			text = text.split(`####REPLACEMENT_TABLE_${nonce}_${index}####`).join(value);
		});

		return text;
	},

	recoverRecursionTag(text: string): string
	{
		if (this.sendReplacement.length > 0)
		{
			this.sendReplacement.forEach((value, index) => {
				text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
			});
		}

		text = text.split('####REPLACEMENT_SP_').join('####REPLACEMENT_PUT_');

		if (this.putReplacement.length > 0)
		{
			do
			{
				this.putReplacement.forEach((value, index) => {
					text = text.replace(`####REPLACEMENT_PUT_${index}####`, value);
				});
			}
			while (text.includes('####REPLACEMENT_PUT_'));
		}

		return text;
	},
};

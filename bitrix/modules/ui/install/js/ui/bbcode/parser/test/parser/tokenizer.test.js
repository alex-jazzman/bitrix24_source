import { BBCodeTokenizer } from '../../src/tokenizer';

const stripIndent = (source) => {
	const lines = source.split('\n').slice(1, -1);
	const minIndent = Math.min(
		...lines.map((line) => {
			return line.split('\t').length - 1;
		}),
	);

	if (minIndent === 0)
	{
		return source;
	}

	const regex = new RegExp(`^\t{${minIndent}}`, 'gm');

	return lines.join('\n').replace(regex, '');
};

describe('BBCodeTokenizer', () => {
	it('should tokenize plain text without tags', () => {
		const bbcode = stripIndent(`
			text only
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'TEXT', content: 'text only' },
			],
		);
	});

	it('should tokenize text with special characters', () => {
		const bbcode = 'a\n\r\nb\t';

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'TEXT', content: 'a' },
				{ type: 'LINEBREAK' },
				{ type: 'LINEBREAK' },
				{ type: 'TEXT', content: 'b' },
				{ type: 'TAB' },
			],
		);
	});

	it('should tokenize text starting with special characters', () => {
		const bbcode = '\nnn\r\nnn\ttt';

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'LINEBREAK' },
				{ type: 'TEXT', content: 'nn' },
				{ type: 'LINEBREAK' },
				{ type: 'TEXT', content: 'nn' },
				{ type: 'TAB' },
				{ type: 'TEXT', content: 'tt' },
			],
		);
	});

	it('should tokenize nested lists', () => {
		const bbcode = stripIndent(`
			[list]
				[*]First item
				[*]Second item
					[list]
						[*]Nested item 1
						[*]Nested item 2
					[/list]
				[*]Third item
			[/list]
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'OPEN_TAG', name: 'list', value: '', attributes: {} },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'First item' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Second item' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'OPEN_TAG', name: 'list', value: '', attributes: {} },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Nested item 1' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Nested item 2' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'CLOSE_TAG', name: 'list' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Third item' },
				{ type: 'LINEBREAK' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'CLOSE_TAG', name: 'list' },
			],
		);
	});

	it('should tokenize void tags correctly', () => {
		const bbcode = stripIndent(`
			[p]test [disk file id=22][/p]
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{
					type: 'OPEN_TAG',
					name: 'p',
					value: '',
					attributes: {},
					unclosed: false,
				},
				{ type: 'TEXT', content: 'test ' },
				{
					type: 'OPEN_TAG',
					name: 'disk',
					value: '',
					attributes: { file: '', id: '22' },
					unclosed: true,
				},
				{ type: 'CLOSE_TAG', name: 'p' },
			],
		);
	});

	it('should tokenize unclosed tags and mark them as such', () => {
		const bbcode = stripIndent(`
			[p][b][code]
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{
					type: 'OPEN_TAG',
					name: 'p',
					value: '',
					attributes: {},
					unclosed: true,
				},
				{
					type: 'OPEN_TAG',
					name: 'b',
					value: '',
					attributes: {},
					unclosed: true,
				},
				{
					type: 'OPEN_TAG',
					name: 'code',
					value: '',
					attributes: {},
					unclosed: true,
				},
			],
		);
	});

	it('should tokenize unopened closing tags as standalone tokens', () => {
		const bbcode = stripIndent(`
			[/p][/b][/code]
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'CLOSE_TAG', name: 'p' },
				{ type: 'CLOSE_TAG', name: 'b' },
				{ type: 'CLOSE_TAG', name: 'code' },
			],
		);
	});

	it('should tokenize list with disk tags', () => {
		const bbcode = stripIndent(`
			[list]
				[*]Item 1
				[*]Item 2[disk file id=n1231 width=600 height=496]
				[*]Item 3
				[*]Item 4
				[*]Item 5[disk file id=n1232 width=600 height=496]
			[/list]
		`);

		const parser = new BBCodeTokenizer();
		const tokens = parser.tokenize(bbcode);

		assert.deepEqual(
			tokens,
			[
				{ type: 'OPEN_TAG', name: 'list', value: '', attributes: {} },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Item 1' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Item 2' },
				{
					type: 'OPEN_TAG',
					name: 'disk',
					value: '',
					attributes: { file: '', id: 'n1231', width: '600', height: '496' },
					unclosed: true,
				},
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Item 3' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Item 4' },
				{ type: 'LINEBREAK' },
				{ type: 'TAB' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'OPEN_TAG', name: '*', value: '', attributes: {} },
				{ type: 'TEXT', content: 'Item 5' },
				{
					type: 'OPEN_TAG',
					name: 'disk',
					value: '',
					attributes: { file: '', id: 'n1232', width: '600', height: '496' },
					unclosed: true,
				},
				{ type: 'LINEBREAK' },
				{ type: 'CLOSE_TAG', name: '*' },
				{ type: 'CLOSE_TAG', name: 'list' },
			],
		);
	});
});

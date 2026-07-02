import parseTag from './parse-tag';
import matchers from './matchers';
import parseText from './parse-text';

export default function parse(html: string, substitutions?: any): Array<any>
{
	const result: any[] = [];

	if (html.indexOf('<') !== 0 && !html.startsWith('{{'))
	{
		const end = html.indexOf('<');
		result.push(...parseText(end === -1 ? html : html.slice(0, end)));
	}

	const commentsContent: any[] = [];
	let commentIndex = -1;
	html = html.replace(matchers.comment, (tag) => {
		commentIndex += 1;
		commentsContent.push(tag.replaceAll(/^<!--|-->$/g, ''));

		return `<!--{{cUid${commentIndex}}}-->`;
	});

	const arr: any[] = [];
	let level = -1;
	let current: any = null;
	(html as any).replace(matchers.tag, (tag: string, index: number) => {
		const start = index + tag.length;
		const nextChar = html.charAt(start);
		let parent: any = null;

		if (tag.startsWith('<!--'))
		{
			const comment = parseTag(tag);
			comment.content = commentsContent[tag.replaceAll(/<!--{{cUid|}}-->/g, '') as any];

			if (level < 0)
			{
				result.push(comment);

				return result;
			}

			parent = arr[level];
			parent.children.push(comment);

			return result;
		}

		if (tag.startsWith('{{'))
		{
			const [placeholder] = parseText(tag);

			if (level < 0)
			{
				result.push(placeholder);

				return result;
			}

			parent = arr[level];
			parent.children.push(placeholder);

			return result;
		}

		if (!tag.startsWith('</'))
		{
			level++;

			current = parseTag(tag);

			if (!current.voidElement && nextChar && nextChar !== '<')
			{
				current.children.push(...parseText(html.slice(start, html.indexOf('<', start))));
			}

			if (level === 0)
			{
				result.push(current);
			}

			parent = arr[level - 1];

			if (parent)
			{
				if (!current.svg)
				{
					current.svg = parent.svg;
				}

				parent.children.push(current);
			}

			arr[level] = current;
		}

		if (tag.startsWith('</') || current.voidElement)
		{
			if (level > -1 && (current.voidElement || current.name === tag.slice(2, -1)))
			{
				level--;
				current = level === -1 ? result : arr[level];
			}

			if (nextChar && nextChar !== '<')
			{
				parent = level === -1 ? result : arr[level].children;

				const end = html.indexOf('<', start);
				const content = html.slice(start, end === -1 ? undefined : end);

				if ((end > -1 && level + parent.length >= 0) || content !== ' ')
				{
					parent.push(...parseText(content));
				}
			}
		}

		return result;
	});

	return result;
}

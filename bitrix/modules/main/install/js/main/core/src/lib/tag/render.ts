import Type from '../type';
import parse from './internal/parse';
import renderNode from './internal/render-node';

const SECTION_STATE_OUTSIDE_TAG = 0;
const SECTION_STATE_IN_TAG = 1;
const SECTION_STATE_IN_ATTR_VALUE_DOUBLE = 2;
const SECTION_STATE_IN_ATTR_VALUE_SINGLE = 3;

const tagNameStart = /[A-Za-z]/;

function transitionFromOutsideTag(section: string, position: number): number
{
	if (section.charAt(position) === '<')
	{
		const next = section.charAt(position + 1);
		if (next === '!' || next === '/' || tagNameStart.test(next))
		{
			return SECTION_STATE_IN_TAG;
		}
	}

	return SECTION_STATE_OUTSIDE_TAG;
}

function transitionFromInTag(char: string): number
{
	if (char === '"')
	{
		return SECTION_STATE_IN_ATTR_VALUE_DOUBLE;
	}

	if (char === '\'')
	{
		return SECTION_STATE_IN_ATTR_VALUE_SINGLE;
	}

	if (char === '>')
	{
		return SECTION_STATE_OUTSIDE_TAG;
	}

	return SECTION_STATE_IN_TAG;
}

function advanceState(state: number, section: string, position: number): number
{
	const char = section.charAt(position);
	switch (state)
	{
		case SECTION_STATE_OUTSIDE_TAG:
			return transitionFromOutsideTag(section, position);
		case SECTION_STATE_IN_TAG:
			return transitionFromInTag(char);
		case SECTION_STATE_IN_ATTR_VALUE_DOUBLE:
			return char === '"' ? SECTION_STATE_IN_TAG : state;
		case SECTION_STATE_IN_ATTR_VALUE_SINGLE:
			return char === '\'' ? SECTION_STATE_IN_TAG : state;
		default:
			return state;
	}
}

function computeSectionStates(sections: ReadonlyArray<string>): number[]
{
	const states: number[] = [];
	let state = SECTION_STATE_OUTSIDE_TAG;

	for (const section of sections)
	{
		for (let position = 0; position < section.length; position++)
		{
			state = advanceState(state, section, position);
		}

		states.push(state);
	}

	return states;
}

export default function render(
	sections: TemplateStringsArray,
	...substitutions: Array<any>
): any
{
	const sectionStates = computeSectionStates(sections);

	const html = sections
		.reduce((acc, item, index) => {
			if (index > 0)
			{
				const substitution = substitutions[index - 1];
				const previousSectionState = sectionStates[index - 1];
				const isInsideAttributeValue = (
					previousSectionState === SECTION_STATE_IN_ATTR_VALUE_DOUBLE
					|| previousSectionState === SECTION_STATE_IN_ATTR_VALUE_SINGLE
				);

				if (!isInsideAttributeValue && (Type.isString(substitution) || Type.isNumber(substitution)))
				{
					return `${acc}${substitution}${item}`;
				}

				return `${acc}{{uid${index}}}${item}`;
			}

			return acc;
		}, sections[0])
		.replaceAll(/^\s+/gm, '')
		.replaceAll(/>\n+/g, '>')
		.replaceAll(/}\n+/g, '}');

	const ast = parse(html);

	if (ast.length === 1)
	{
		const refs: any[] = [];
		const renderedNode = renderNode({
			node: ast[0],
			substitutions,
			refs,
		});

		if (Type.isArrayFilled(refs))
		{
			return Object.fromEntries([['root', renderedNode], ...refs] as any);
		}

		return renderedNode;
	}

	if (ast.length > 1)
	{
		const refs: any[] = [];
		const renderedNodes = ast.map((node: any) => {
			return renderNode({
				node,
				substitutions,
				refs,
			});
		});

		if (Type.isArrayFilled(refs))
		{
			return Object.fromEntries([['root', renderedNodes], ...refs] as any);
		}

		return renderedNodes;
	}

	return false;
}

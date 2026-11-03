import { BX, resolve } from './internal/global';
import { CHECK_FORM_ELEMENTS } from './const';
import { util } from './util';

/**
 * Tree walking and node matching (MOD-01).
 *
 * `checkNode` is the core of every `findChild*`, `findParent`, `findNextSibling`,
 * `findPreviousSibling` and - from the neighbouring module - `delegateEvent`. It is also the
 * published `BX.checkNode` itself: the layer used to wrap it in a one-line forwarder, and the
 * export publishes the same function the neighbours already import by name. Inside the subtree it
 * is reached by a plain import - nothing calls back the other way, so there is no ring and late
 * binding would buy nothing (ADR 3.4).
 *
 * Three defects and one short-circuit inside it are carried over verbatim (FIX-01): the
 * `attribute` and `property` array branches test the whole array instead of its element, the
 * `property` object branch ignores anything that is neither a string nor a RegExp, and a
 * `callback` key returns out of the loop so the key order of `params` decides the answer. All
 * four are pinned by `test/old/core/dom-traverse.test.ts` as the behaviour consumers have today.
 */

export function firstChild(el: any): any
{
	return BX.type.isDomNode(el) ? el.firstElementChild : null;
}

export function lastChild(el: any): any
{
	return BX.type.isDomNode(el) ? el.lastElementChild : null;
}

export function previousSibling(el: any): any
{
	return BX.type.isDomNode(el) ? el.previousElementSibling : null;
}

export function nextSibling(el: any): any
{
	return BX.type.isDomNode(el) ? el.nextElementSibling : null;
}

/*
	params: {
		obj : html node
		className : className value
		recursive : used only for older browsers to optimize the tree traversal, in new browsers the search is always recursively, default - true
	}

	Search all nodes with className
*/
/**
 * @deprecated
 * @use .querySelectorAll
 * @param obj
 * @param className
 * @param recursive
 * @return {*}
 */
export function findChildrenByClassName(obj: any, className: any, recursive?: any): any
{
	if (!obj || !obj.childNodes)
	{
		return null;
	}

	let result: any = [];
	if (typeof (obj.getElementsByClassName) == 'undefined')
	{
		recursive = recursive !== false;
		result = findChildren(obj, { className }, recursive);
	}
	else
	{
		const col = obj.getElementsByClassName(className);
		// FIX-01 #1: i and l were implicit globals - a ReferenceError under strict mode
		for (let i = 0, l = col.length; i < l; i++)
		{
			result[i] = col[i];
		}
	}

	return result;
}

/*
	params: {
		obj : html node
		className : className value
		recursive : used only for older browsers to optimize the tree traversal, in new browsers the search is always recursively, default - true
	}

	Search first node with className
*/
/**
 * @deprecated
 * @use .querySelector
 * @param obj
 * @param className
 * @param recursive
 * @return {*}
 */
export function findChildByClassName(obj: any, className: any, recursive?: any): any
{
	if (!obj || !obj.childNodes)
	{
		return null;
	}

	let result = null;
	if (typeof (obj.getElementsByClassName) == 'undefined')
	{
		recursive = recursive !== false;
		result = findChild(obj, { className }, recursive);
	}
	else
	{
		const col = obj.getElementsByClassName(className);
		if (col && typeof (col[0]) != 'undefined')
		{
			result = col[0];
		}
		else
		{
			result = null;
		}
	}

	return result;
}

/*
	params: {
		tagName|tag : 'tagName',
		className|class : 'className',
		attribute : {attribute : value, attribute : value} | attribute | [attribute, attribute....],
		property : {prop: value, prop: value} | prop | [prop, prop]
	}

	all values can be RegExps or strings
*/
/**
 * @deprecated
 * @use .querySelectorAll
 * @param obj
 * @param params
 * @param recursive
 * @return {*|Node}
 */
export function findChildren(obj: any, params: any, recursive?: any): any
{
	return findChild(obj, params, recursive, true);
}

/**
 * @deprecated
 * @use .querySelectorAll
 * @param obj
 * @param params
 * @param recursive
 * @param get_all
 * @return {*}
 */
export function findChild(obj: any, params: any, recursive?: any, get_all?: any): any
{
	if (!obj || !obj.childNodes)
	{
		return null;
	}

	recursive = Boolean(recursive);
	get_all = Boolean(get_all);

	const n = obj.childNodes.length;
	let result: any = [];

	for (let j = 0; j < n; j++)
	{
		const child = obj.childNodes[j];

		if (checkNode(child, params))
		{
			if (get_all)
			{
				result.push(child);
			}
			else
			{
				return child;
			}
		}

		if (recursive == true)
		{
			const res = findChild(child, params, recursive, get_all);
			if (res)
			{
				if (get_all)
				{
					result = util.array_merge(result, res);
				}
				else
				{
					return res;
				}
			}
		}
	}

	if (get_all || result.length > 0)
	{
		return result;
	}

	return null;
}

/**
 * @deprecated
 * @use .closest()
 * @param obj
 * @param params
 * @param maxParent
 * @return {*}
 */
export function findParent(obj: any, params: any, maxParent?: any): any
{
	if (!obj)
	{
		return null;
	}

	let o = obj;
	while (o.parentNode)
	{
		const parent = o.parentNode;

		if (checkNode(parent, params))
		{
			return parent;
		}

		o = parent;

		if (maxParent
			&& (BX.type.isFunction(maxParent)
				|| typeof maxParent == 'object'))
		{
			if (BX.type.isElementNode(maxParent))
			{
				if (o == maxParent)
				{
					break;
				}
			}
			else if (checkNode(o, maxParent))
			{
				break;
			}
		}
	}

	return null;
}

/**
 * @deprecated
 * @use .querySelector
 * @param obj
 * @param params
 * @return {*}
 */
export function findNextSibling(obj: any, params: any): any
{
	if (!obj)
	{
		return null;
	}

	let o = obj;
	while (o.nextSibling)
	{
		const sibling = o.nextSibling;
		if (checkNode(sibling, params))
		{
			return sibling;
		}

		o = sibling;
	}

	return null;
}

/**
 * @deprecated
 * @use .querySelector
 * @param obj
 * @param params
 * @return {*}
 */
export function findPreviousSibling(obj: any, params: any): any
{
	if (!obj)
	{
		return null;
	}

	let o = obj;
	while (o.previousSibling)
	{
		const sibling = o.previousSibling;
		if (checkNode(sibling, params))
		{
			return sibling;
		}

		o = sibling;
	}

	return null;
}

/**
 * @deprecated
 * @use .querySelectorAll
 * @param form
 * @return {Array}
 */
export function findFormElements(form: any): any
{
	if (BX.type.isString(form))
	{
		form = document.forms[form] || resolve(form);
	}

	let res: any = [];

	if (BX.type.isElementNode(form))
	{
		if (form.tagName.toUpperCase() == 'FORM')
		{
			// a live HTMLCollection here and a plain array below - the asymmetry is the contract
			res = form.elements;
		}
		else
		{
			res = findChildren(form, CHECK_FORM_ELEMENTS, true);
		}
	}

	return res;
}

/**
 * @deprecated
 * @use .contains()
 * @param whichNode
 * @param forNode
 * @return {boolean}
 */
export function isParentForNode(whichNode: any, forNode: any): boolean
{
	if (BX.type.isDomNode(whichNode) && BX.type.isDomNode(forNode))
	{
		return whichNode.contains(forNode);
	}

	return false;
}

export function clearNodeCache(): boolean
{
	return false;
}

/**
 * Creates document fragment with child nodes.
 *
 * @param {Node[]} nodes
 * @return {DocumentFragment}
 */
export function createFragment(nodes?: any): DocumentFragment
{
	const fragment = document.createDocumentFragment();

	if (!BX.type.isArray(nodes))
	{
		return fragment;
	}

	for (let i = 0; i < nodes.length; i++)
	{
		fragment.appendChild(nodes[i]);
	}

	return fragment;
}

export function isNodeInDom(node: any, doc?: any): boolean
{
	// the doc argument is dropped on recursion, so it only decides the first comparison
	return node === (doc || document) ? true
		: (node.parentNode ? isNodeInDom(node.parentNode) : false);
}

export function isNodeHidden(node: any): boolean
{
	if (node === document)
	{
		return false;
	}

	if (BX.style(node, 'display') == 'none')
	{
		return true;
	}

	// a node without a parent is neither the document nor visible: detached counts as hidden
	return node.parentNode ? isNodeHidden(node.parentNode) : true;
}

export function checkNode(obj: any, params: any): any
{
	params = params || {};

	if (BX.type.isFunction(params))
	{
		return params.call(window, obj);
	}

	if (!params.allowTextNodes && !BX.type.isElementNode(obj))
	{
		return false;
	}

	let j;
	let len;
	for (const i in params)
	{
		if (Object.prototype.hasOwnProperty.call(params, i))
		{
			switch (i)
			{
				case 'tag':
				case 'tagName':
					if (BX.type.isString(params[i]))
					{
						if (obj.tagName.toUpperCase() != params[i].toUpperCase())
						{
							return false;
						}
					}
					else if (params[i] instanceof RegExp)
					{
						if (!params[i].test(obj.tagName))
						{
							return false;
						}
					}
					break;

				case 'class':
				case 'className':
					if (BX.type.isString(params[i]))
					{
						if (!BX.hasClass(obj, params[i]))
						{
							return false;
						}
					}
					else if (params[i] instanceof RegExp)
					{
						if (!BX.type.isString(obj.className) || !params[i].test(obj.className))
						{
							return false;
						}
					}
					break;

				case 'attr':
				case 'attrs':
				case 'attribute':
					if (BX.type.isString(params[i]))
					{
						if (!obj.getAttribute(params[i]))
						{
							return false;
						}
					}
					else if (BX.type.isArray(params[i]))
					{
						for (j = 0, len = params[i].length; j < len; j++)
						{
							// carried verbatim: the whole array is used where params[i][j] was meant
							if (params[i] && !obj.getAttribute(params[i]))
							{
								return false;
							}
						}
					}
					else
					{
						for (j in params[i])
						{
							if (Object.prototype.hasOwnProperty.call(params[i], j))
							{
								const q = obj.getAttribute(j);
								if (params[i][j] instanceof RegExp)
								{
									if (!BX.type.isString(q) || !params[i][j].test(q))
									{
										return false;
									}
								}
								else if (q != `${params[i][j]}`)
								{
									return false;
								}
							}
						}
					}
					break;

				case 'property':
				case 'props':
					if (BX.type.isString(params[i]))
					{
						if (!obj[params[i]])
						{
							return false;
						}
					}
					else if (BX.type.isArray(params[i]))
					{
						for (j = 0, len = params[i].length; j < len; j++)
						{
							// carried verbatim: same defect as the attribute array branch
							if (params[i] && !obj[params[i]])
							{
								return false;
							}
						}
					}
					else
					{
						for (j in params[i])
						{
							if (BX.type.isString(params[i][j]))
							{
								if (obj[j] != params[i][j])
								{
									return false;
								}
							}
							else if (params[i][j] instanceof RegExp)
							{
								if (!BX.type.isString(obj[j]) || !params[i][j].test(obj[j]))
								{
									return false;
								}
							}
							// carried verbatim: no else - a numeric or boolean value counts as matched
						}
					}
					break;

				case 'callback':
					// carried verbatim: returns out of the loop, so the key order of params matters
					return params[i](obj);

				// no default
			}
		}
	}

	return true;
}

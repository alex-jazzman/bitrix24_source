import { BX, resolve } from './internal/global';
import { util } from './util';
import { delegate } from './delegate';

/**
 * The wait indicator (MOD-01).
 *
 * `showWait`, `closeWait` and the private positioning helper share one piece of state - the queue
 * of open indicators - and that queue is the whole reason the group exists: `closeWait()` with no
 * arguments pops the last entry off it. Two copies of the queue would mean an indicator that can
 * never be closed.
 *
 * The inline styles are hard-coded in the source and are carried over character for character:
 * consumers style around the exact background, border and padding, so they are part of the
 * observable contract rather than an implementation detail.
 */

let lastWait: any[] = [];

/* non-xhr loadings */
export function showWait(node?: any, msg?: any): any
{
	node = resolve(node) || document.body || document.documentElement;
	msg = msg || BX.message('JS_CORE_LOADING');

	// a node without an id gets a random, unrepeatable container id - `closeWait` therefore
	// cannot find the indicator by id again and falls back to the queue
	const container_id = node.id || Math.random();

	const obMsg = node.bxmsg = document.body.appendChild(BX.create('DIV', {
		props: {
			id: `wait_${container_id}`,
		},
		style: {
			background: 'url("/bitrix/js/main/core/images/wait.gif") no-repeat scroll 10px center #fcf7d1',
			border: '1px solid #E1B52D',
			color: 'black',
			fontFamily: 'Verdana,Arial,sans-serif',
			fontSize: '11px',
			padding: '10px 30px 10px 37px',
			position: 'absolute',
			textAlign: 'center',
		},
		text: msg,
	}));

	BX.ZIndexManager.register(obMsg);
	BX.ZIndexManager.bringToFront(obMsg);

	setTimeout(delegate(_adjustWait, node), 10);

	lastWait[lastWait.length] = obMsg;

	return obMsg;
}

export function closeWait(node?: any, obMsg?: any): void
{
	if (node && !obMsg)
	{
		obMsg = node.bxmsg;
	}

	if (node && !obMsg && BX.hasClass(node, 'bx-core-waitwindow'))
	{
		obMsg = node;
	}

	if (node && !obMsg)
	{
		obMsg = resolve(`wait_${node.id}`);
	}

	if (!obMsg)
	{
		obMsg = lastWait.pop();
	}

	if (obMsg && obMsg.parentNode)
	{
		for (let i = 0, len = lastWait.length; i < len; i++)
		{
			if (obMsg == lastWait[i])
			{
				// the result is assigned back, unlike the defect in `allowEvent`
				lastWait = util.deleteFromArray(lastWait, i);
				break;
			}
		}

		BX.ZIndexManager.unregister(obMsg);
		obMsg.parentNode.removeChild(obMsg);
		if (node)
		{
			node.bxmsg = null;
		}
		BX.cleanNode(obMsg, true);
	}
}

/**
 * Called with `this` bound to the node the indicator belongs to, not to the indicator itself.
 */
function _adjustWait(this: any): void
{
	if (!this.bxmsg)
	{
		return;
	}

	const arContainerPos = BX.pos(this);
	let div_top = arContainerPos.top;

	if (div_top < BX.GetDocElement().scrollTop)
	{
		div_top = BX.GetDocElement().scrollTop + 5;
	}

	this.bxmsg.style.top = `${div_top + 5}px`;

	if (this == BX.GetDocElement())
	{
		this.bxmsg.style.right = '5px';
	}
	else
	{
		this.bxmsg.style.left = `${arContainerPos.right - this.bxmsg.offsetWidth - 5}px`;
	}
}

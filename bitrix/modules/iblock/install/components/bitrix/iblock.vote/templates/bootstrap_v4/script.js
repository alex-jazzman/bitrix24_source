(function (window)
{
	if (!!window.JCFlatVote)
	{
		return;
	}

	window.JCFlatVote = {
		trace_vote: function (div, flag)
		{
			var my_div;
			//Left from current
			my_div = div;
			while (my_div = my_div.previousSibling)
			{
				if (flag)
					BX.addClass(my_div, 'bx-star-active');
				else
					BX.removeClass(my_div, 'bx-star-active');
			}
			//current
			if (flag)
				BX.addClass(div, 'bx-star-active');
			else
				BX.removeClass(div, 'bx-star-active');
			//Right from the current
			my_div = div;
			while (my_div = my_div.nextSibling)
			{
				BX.removeClass(my_div, 'bx-star-active');
			}
		},

		// the star in focus is the one stop of Tab, however the focus came to it
		focus_star: function (star)
		{
			var stars = star.parentNode.querySelectorAll('[role="radio"]');
			for (var i = 0; i < stars.length; i++)
			{
				stars[i].setAttribute('tabindex', stars[i] === star ? '0' : '-1');
			}

			this.trace_vote(star, true);
		},

		// arrows move the choice round the scale and never vote:
		// a vote cannot be taken back, so it waits for Enter, Space or a click
		move_focus: function (event)
		{
			var group = event.currentTarget;
			var star = event.target;
			if (
				!star
				|| star.parentNode !== group
				|| star.getAttribute('role') !== 'radio'
				|| event.altKey
				|| event.ctrlKey
				|| event.metaKey
			)
			{
				return;
			}

			var stars = group.querySelectorAll('[role="radio"]');
			var index = Array.prototype.indexOf.call(stars, star);
			var next;
			switch (event.key)
			{
				case 'ArrowRight':
				case 'ArrowDown':
					next = (index + 1) % stars.length;
					break;
				case 'ArrowLeft':
				case 'ArrowUp':
					next = (index - 1 + stars.length) % stars.length;
					break;
				case 'Home':
					next = 0;
					break;
				case 'End':
					next = stars.length - 1;
					break;
				default:
					return;
			}

			event.preventDefault();
			if (next !== index)
			{
				stars[next].focus();
			}
		},

		announce: function (text)
		{
			var accessibility = BX.UI && BX.UI.Accessibility;
			if (!accessibility || !accessibility.LiveAnnouncer || !BX.type.isNotEmptyString(text))
			{
				return;
			}

			accessibility.LiveAnnouncer.announce(text);
		},

		do_vote: function (div, parent_id, arParams)
		{
			var r = div.id.match(/^vote_(\d+)_(\d+)$/);

			var vote_id = r[1];
			var vote_value = r[2];

			arParams['vote'] = 'Y';
			arParams['vote_id'] = vote_id;
			arParams['rating'] = vote_value;
			BX.ajax.post(
				'/bitrix/components/bitrix/iblock.vote/component.php',
				arParams,
				function (data)
				{
					var obContainer = BX(parent_id);
					if (obContainer)
					{
						var obResult = BX.create('DIV');
						obResult.innerHTML = data;
						var obNewContainer = obResult.firstElementChild;
						if (!obNewContainer)
						{
							return;
						}

						obContainer.parentNode.replaceChild(obNewContainer, obContainer);
						obNewContainer.focus();
						window.JCFlatVote.announce(obNewContainer.getAttribute('data-vote-accepted'));
					}
				}
			);
		}
	}
}
)(window);

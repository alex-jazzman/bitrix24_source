<?php

class CXMPPParser
{
	var $arTagList = array();
	var $arTagValue = array();
	var $array;
	var $string;
	var $raw;

	public static function ToArray($text)
	{
		$parser = new CXMPPParser($text);
		if (!$parser->Parse())
			return false;
		return $parser->array;
	}

	public static function ToXml($ar)
	{
		$parser = new CXMPPParser();
		$text = $parser->toString($ar);
		return $text;
	}

	public function __construct($raw=false)
	{
		$this->raw = $this->ConvertCharsetToSite(trim($raw));
	}

	function ReadTags($pos = 0)
	{
		$str = $this->raw;

		$start = mb_strpos($str, '<', $pos);
		$end = mb_strpos($str, '>', $start) + 1;

		if ($start===false || $end===false)
			return;

		$tag = trim(mb_substr($str, $start, $end - $start));
		if ($tag)
		{
			$this->arTagList[] = array($tag,$start,$end);

			if ($end < mb_strlen($str))
				return $end;
			else
				return true;
		}
		return;
	}

	function Parse()
	{
		$r = 0;
		while(is_numeric($r = $this->ReadTags($r)));
		if ($r !== true)
			return;

		$arTmpTags = array();
		$child = array();
		$level_items = array();
		$level = 0;
		$bLastOpenTag = false;
		foreach($this->arTagList as $arTag)
		{
			$name = $this->GetName($arTag[0]);

			if (mb_substr($arTag[0], -2) == '/>') // self closed
			{
				$val = array(
					'.' => $this->GetAttr($arTag[0]),
					'#' => ''
				);

				if (!$level_items[$level][$name])
					$level_items[$level][$name] = $val;
				elseif (!$level_items[$level][$name][0])
					$level_items[$level][$name] = array($level_items[$level][$name], $val);
				else
					$level_items[$level][$name][] = $val;

				$child = $level_items[$level];
				$bLastOpenTag = 0;
			}
			elseif (mb_substr($arTag[0], 0, 2) != '</') // opener
			{
				$level++;
				$arTmpTags[] = $arTag;
				$bLastOpenTag = 1;
			}
			else // closer
			{
				unset($level_items[$level]);
				$level--;
				$arOpenTag = array_pop($arTmpTags);
				$open_name = $this->GetName($arOpenTag[0]);

				if ($open_name == $name)
				{
					if ($bLastOpenTag) // string
					{
						$start = $arOpenTag[2];
						$end = $arTag[1];
						$val = array('#' => mb_substr($this->raw, $start, $end - $start));
					}
					else
						$val = $child;

					$val = array_merge(array('.' => $this->GetAttr($arOpenTag[0])), $val);

					if (!$level_items[$level][$name])
						$level_items[$level][$name] = $val;
					elseif (!$level_items[$level][$name][0])
						$level_items[$level][$name] = array($level_items[$level][$name], $val);
					else
						$level_items[$level][$name][] = $val;

					$child = $level_items[$level];
				}
				else
					return; // close non current tag

				$bLastOpenTag = 0;
			}
		}
		if ($level != 0) // opened or non closed tags left
			return;

		$this->array = $child;
		return true;
	}

	function __toStringInternal($ar = false)
	{
		if ($ar === false)
			$ar = $this->array;

		$str = '';
		foreach($ar as $name => $child)
		{
			$attr = array();
			$content = null;

			if (array_key_exists('#', $child))
			{
				$content = $child['#'];
				if (is_array($child['.']))
					foreach($child['.'] as $k => $v)
						$attr[] = $k.'="'.$v.'"'; // there are no quotes in attributes
			}
			else
			{
				if ($name == '.')
					continue;
				else
				{
					if ($child[0])
					{
						if (is_array($child))
							foreach($child as $item)
								$str .=  $this->__toStringInternal(array($name => $item));
						continue;
					}
					else
					{
						if (is_array($child['.']))
							foreach($child['.'] as $k => $v)
								$attr[] = $k.'="'.$v.'"'; // there are no quotes in attributes
						$content = $this->__toStringInternal($child);
					}
				}
			}
			$str .= '<'.$name.(count($attr)?' '.implode(' ',$attr):'').(isset($content)?'>'.$content.'</'.$name.'>':'/>');
		}


		$this->string = $str;
		return $this->string;
	}

	function toString($ar = false)
	{
		$r = $this->__toStringInternal($ar);
		$r = $this->ConvertCharsetFromSite($r);
		return $r;
	}

	function ConvertCharsetToSite($text)
	{
		if (!defined('BX_UTF'))
			$text = $GLOBALS["APPLICATION"]->ConvertCharset($text, "UTF-8", SITE_CHARSET);

		return $text;
	}

	function ConvertCharsetFromSite($text)
	{
		if (!defined('BX_UTF'))
			$text = $GLOBALS["APPLICATION"]->ConvertCharset($text, SITE_CHARSET, "UTF-8");

		return $text;
	}

	function GetName($tag)
	{
		$pos = mb_strpos($tag, ' ');
		if (!$pos)
			$pos = mb_strpos($tag, '>');
		if (!$pos) // ignoring 0
			return;

		return mb_strtolower(trim(mb_substr($tag, 1, $pos - 1), '/'));
	}

	function GetAttr($tag)
	{
		if (($pos = mb_strpos($tag, ' '))===false)
			return array();

		$tag = mb_substr($tag, $pos, -1);
		$l = mb_strlen($tag);

		$arAttr = array();
		$bParam = true;
		$param = "";

		for ($i=0;$i<$l;$i++)
		{
			$chr = $tag[$i];
			if ($bParam)
			{
				if ($chr == '=')
				{
					$bParam = false;
					continue;
				}
				else
					$param .= $chr;
			}
			else
			{
				if ($chr == '"' || $chr = "'")
				{
					$open = $chr;
					$pos = mb_strpos($tag, $open, $i + 1);
					if ($pos === false)
						return;

					$val = mb_substr($tag, $i + 1, $pos - $i - 1);
					$arAttr[trim($param)] = $val;
					$i = $pos;
					$param = '';
					$val = '';
					$bParam = true;
				}
			}
		}

		return $arAttr;
	}
}

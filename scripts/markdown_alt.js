function _alternativeConvertMarkdownToHTML(text) {
	var highlightspan = "<span style=\"background-color: #FFFF00\">";
	var highlightendspan = '</span>';
	
	var reader = new commonmark.Parser();
	var writer = new commonmark.HtmlRenderer();

	var parsed = reader.parse(text);  // tree now available for walking

	var result = writer.render(parsed);

	result = _extraMarkdownReplaceAll(result, /\^\^\^[^^]*\^\^\^/g, 3, '<sub>', '</sub>'); 
	result = _extraMarkdownReplaceAll(result, /\^\^[^^]*\^\^/g, 2, '<sup>', '</sup>'); 
	result = _extraMarkdownReplaceAll(result, /\~\~[^~]*\~\~/g, 2, '<s>', '</s>'); 
	result = _extraMarkdownReplaceAll(result, /\%\%[^%]*\%\%/g, 2, highlightspan, highlightendspan);
	
	result = result.replaceAll('&amp;amp;', '&');

	return result;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function _extraMarkdownReplaceAll(originalString, pattern, patternlength, opentoken, closetoken)
{
	var s = originalString;

	var result = s.match(pattern);
	if (result !== null) {
		for (var i = 0; i < result.length; i++) {
			s = s.replace(result[i], opentoken + result[i].slice(patternlength, -patternlength) + closetoken);
		}
	}

	return s;
}

/**
 * Escapes HTML and then re-injects spans for SYSTEM: warnings and JSON
 * key/string syntax highlighting. Used for scenario boxes.
 */
export function highlightScenario(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  let html = div.innerHTML;
  html = html.replace(/SYSTEM:/g, '<span class="highlight">SYSTEM:</span>');
  html = html.replace(
    /("(?:[a-zA-Z_$][\w$]*|[^"]+)")(\s*:)/g,
    '<span class="json-key">$1</span>$2',
  );
  html = html.replace(/(:\s*)("[^"]*")/g, '$1<span class="json-string">$2</span>');
  html = html.replace(/(\[\s*|,\s*)("[^"]*")/g, '$1<span class="json-string">$2</span>');
  return html;
}

export function escapeAttr(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

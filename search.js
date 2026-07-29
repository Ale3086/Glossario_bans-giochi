// Search Logic

// Debounce helper
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Normalize text for search (accents, case)
export function normalizeText(text) {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Calculate partial match (simple word-by-word substring match for typo tolerance approximation)
function isPartialMatch(queryTokens, targetText) {
  const normTarget = normalizeText(targetText);
  // Every word in query must be found as a substring in target
  return queryTokens.every(token => normTarget.includes(token));
}

export function performSearch(query, items, fields) {
  if (!query || query.trim() === '') return items;

  const rawTokens = normalizeText(query).split(' ').filter(t => t.length > 0);
  if (rawTokens.length === 0) return items;

  return items.filter(item => {
    return fields.some(field => {
      const fieldValue = item[field];
      return isPartialMatch(rawTokens, fieldValue);
    });
  });
}

// Highlight function: safely wraps matches in <mark class="highlight">
export function highlightMatch(text, query) {
  if (!text) return "";
  if (!query || query.trim() === "") {
    // We still want to escape text even if no query
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  const tokens = normalizeText(query).split(' ').filter(t => t.length > 0);
  
  // First escape original text completely
  const div = document.createElement('div');
  div.textContent = text;
  let escapedHtml = div.innerHTML;

  if (tokens.length === 0) return escapedHtml;

  // Simple highlighting: replace matching words ignoring case (naively on escaped text for simple alphanumeric)
  // A perfect implementation would walk text nodes, but this is a lightweight approximation.
  tokens.forEach(token => {
      // Escape regex chars in token
      const safeToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Replace ignoring case and accents (tricky in standard JS regex, we do a basic case-insensitive match on the escaped HTML)
      // This works well enough for simple English/Italian characters.
      const regex = new RegExp(`(${safeToken})`, 'gi');
      escapedHtml = escapedHtml.replace(regex, `<mark class="highlight">$1</mark>`);
  });

  return escapedHtml;
}

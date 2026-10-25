/* Feedback button. Paste your Google Form link between the quotes below.
   While it is empty the button stays hidden. */
(function () {
  'use strict';
  const FEEDBACK_URL = '';

  if (!FEEDBACK_URL) return;
  document.querySelectorAll('a[data-feedback]').forEach(a => {
    a.href = FEEDBACK_URL; a.target = '_blank'; a.rel = 'noopener'; a.hidden = false;
  });
})();

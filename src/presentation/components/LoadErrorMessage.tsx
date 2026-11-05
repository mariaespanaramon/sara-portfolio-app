/**
 * What visitors see when content fails to load.
 *
 * Deliberately generic: the underlying error means nothing to a visitor, and the
 * hooks already log it to the console for whoever needs the details.
 */
export function LoadErrorMessage() {
  return (
    <p className="text-site-text-secondary font-light">
      This content could not be loaded. Please try again in a moment.
    </p>
  );
}

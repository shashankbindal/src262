import { useEffect } from 'react';

/**
 * Sets document.title for the lifetime of the calling page component,
 * restoring the previous title on unmount. Vite SPAs have no per-route
 * <title> otherwise, since index.html only sets one static title.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}

/**
 * Returns a wrapper that delays invoking `fn` until `wait`ms have elapsed
 * since the last call — used to avoid re-filtering the board on every
 * keystroke in the search input.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

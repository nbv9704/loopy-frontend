let loadingStartTime: number | undefined

/** Preserve the CSS clock before React replaces the initial HTML skeleton. */
export function captureLoadingMotion(root: HTMLElement | null) {
  const now = document.timeline?.currentTime
  if (typeof now !== 'number') return
  const animations = root?.getAnimations?.({ subtree: true }) ?? []
  const start = animations.find(animation => typeof animation.startTime === 'number')?.startTime
  loadingStartTime = typeof start === 'number' ? start : now
}

/** Every mounted loader joins the same clock before paint, including Auth and language changes. */
export function syncLoadingMotion(root: HTMLElement | null) {
  const now = document.timeline?.currentTime
  if (!root?.getAnimations || typeof now !== 'number') return
  loadingStartTime ??= now
  for (const animation of root.getAnimations({ subtree: true })) {
    animation.startTime = loadingStartTime
  }
}

export function buildShareUrl(moduleId: string, userId: string): string {
  return `${window.location.origin}${window.location.pathname}?moduleId=${encodeURIComponent(moduleId)}&userId=${encodeURIComponent(userId)}`;
}

export function copyShareLink(moduleId: string, userId: string): void {
  const url = buildShareUrl(moduleId, userId);
  navigator.clipboard.writeText(url);
}

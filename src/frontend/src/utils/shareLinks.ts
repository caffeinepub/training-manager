export function buildShareUrl(moduleId: string, userId: string): string {
  return `${window.location.origin}${window.location.pathname}?moduleId=${encodeURIComponent(moduleId)}&userId=${encodeURIComponent(userId)}`;
}

export function copyShareLink(moduleId: string, userId: string): void {
  const url = buildShareUrl(moduleId, userId);
  navigator.clipboard.writeText(url);
}

export function buildPublicModuleUrl(moduleId: string): string {
  return `${window.location.origin}${window.location.pathname}?publicModule=${encodeURIComponent(moduleId)}`;
}

export function copyPublicModuleLink(moduleId: string): void {
  navigator.clipboard.writeText(buildPublicModuleUrl(moduleId));
}

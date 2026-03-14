export function buildShareUrl(moduleId: string, userId: string): string {
  return `${window.location.origin}${window.location.pathname}?moduleId=${encodeURIComponent(moduleId)}&userId=${encodeURIComponent(userId)}`;
}

export function copyShareLink(moduleId: string, userId: string): void {
  const url = buildShareUrl(moduleId, userId);
  navigator.clipboard.writeText(url);
}

export function buildPublicModuleUrl(
  moduleId: string,
  assignedUserId?: string,
): string {
  const base = `${window.location.origin}${window.location.pathname}?publicModule=${encodeURIComponent(moduleId)}`;
  if (assignedUserId) {
    return `${base}&assignedUserId=${encodeURIComponent(assignedUserId)}`;
  }
  return base;
}

export function copyPublicModuleLink(
  moduleId: string,
  assignedUserId?: string,
): void {
  navigator.clipboard.writeText(buildPublicModuleUrl(moduleId, assignedUserId));
}

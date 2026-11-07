const searchRoutes = new Map<string, string>([ [":3", "/x7q9v2k4"] ]);

export function getSearchShortcut(query: string): string | undefined {
  return searchRoutes.get(query.trim().toLowerCase());
}

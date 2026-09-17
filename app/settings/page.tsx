import { cookies } from 'next/headers';
import { SETTINGS_COOKIE_NAME, isSessionValidCookieValue } from '@/lib/security';
import { SettingsAuth } from '@/components/settings-auth';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SETTINGS_COOKIE_NAME)?.value;
  const isAuthenticated = isSessionValidCookieValue(sessionValue);

  return <SettingsAuth initialAuthenticated={isAuthenticated} />;
}

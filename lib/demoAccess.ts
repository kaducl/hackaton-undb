import type { Community, User } from './localCommunity';

// Restore access only to a predefined demo account, never deleted personal data.
export function restoreDemoAccess(community: Community, email: string, demoAccounts: readonly User[]): Community {
 if (!demoAccounts.some(account => account.email === email) || !community.deletedDemoEmails.includes(email)) return community;
 return {
  ...community,
  deletedDemoEmails: community.deletedDemoEmails.filter(deletedEmail => deletedEmail !== email),
 };
}

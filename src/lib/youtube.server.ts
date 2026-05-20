import { google } from 'googleapis';
import { prisma } from './db';
import { decrypt } from './crypto';

export async function getYouTubeClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  });

  if (!account) {
    throw new Error('User not connected to YouTube');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL
  );

  oauth2Client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: account.refreshToken ? decrypt(account.refreshToken) : undefined,
  });

  return google.youtube({ version: 'v3', auth: oauth2Client });
}

export async function getVideoDetails(youtube: any, videoIds: string[]) {
  const response = await youtube.videos.list({
    part: ['snippet', 'contentDetails', 'statistics'],
    id: videoIds,
  });

  return response.data.items || [];
}

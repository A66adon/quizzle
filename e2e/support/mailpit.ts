import { request, expect } from '@playwright/test';

type Message = { ID: string; To: { Address: string }[] };

export async function capturedLink(email: string, path: '/verify-email' | '/reset-password', excluded: string[] = []) {
  const mail = await request.newContext({ baseURL: process.env.MAILPIT_URL || 'http://localhost:8025' });
  let link: URL | undefined;
  try {
    await expect.poll(async () => {
      const response = await mail.get('/api/v1/messages');
      if (!response.ok()) return false;
      const inbox = await response.json() as { messages: Message[] };
      for (const message of inbox.messages.filter(item => item.To.some(to => to.Address === email))) {
        const detailResponse = await mail.get(`/api/v1/message/${message.ID}`);
        if (!detailResponse.ok()) continue;
        const detail = await detailResponse.json() as { Text?: string; HTML?: string };
        const body = `${detail.Text || ''}\n${detail.HTML || ''}`.replace(/&amp;/g, '&');
        const candidates = body.match(/https?:\/\/[^\s<>"']+/g) || [];
        for (const candidate of candidates) {
          const parsed = new URL(candidate);
          if (parsed.pathname === path && parsed.searchParams.has('token') && !excluded.includes(parsed.toString())) {
            const expectedOrigin = new URL(process.env.BASE_URL || 'http://localhost:8080').origin;
            if (parsed.origin !== expectedOrigin) throw new Error('Email link uses an unexpected public origin');
            link = parsed;
            return true;
          }
        }
      }
      return false;
    }, { timeout: 30_000, message: 'A matching SMTP lifecycle email arrives' }).toBe(true);
    if (!link) throw new Error('SMTP link missing');
    return link;
  } finally {
    await mail.dispose();
  }
}

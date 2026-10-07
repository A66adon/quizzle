import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { authenticated, createQuiz, quiz } from '../support/app';

type Draft = {
  schemaVersion: number; accountId: string; fileName: string | null;
  baseVersion: number | null; updatedAt: number; writerId: string;
  raw: string; currentIndex: number; sent: null;
};

async function draftRecord(page: Page, fileName: string | null, version: number | null, title: string) {
  const { accountId } = await (await page.request.get('/admin/api/account/settings')).json();
  const draft: Draft = {
    schemaVersion: 1, accountId, fileName, baseVersion: version,
    updatedAt: Date.now(), writerId: 'synthetic-foreign-writer',
    raw: JSON.stringify(quiz(title)), currentIndex: 0, sent: null
  };
  const prefix = `quizzle-editor-draft:v1:${encodeURIComponent(accountId)}:${encodeURIComponent(fileName || 'new')}:`;
  return { draft, prefix };
}

async function store(page: Page, records: Record<string, string>) {
  await page.evaluate(values => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, records);
}

async function localDrafts(page: Page, prefix: string) {
  return page.evaluate(keyPrefix => Object.keys(localStorage)
    .filter(key => key.startsWith(keyPrefix))
    .map(key => JSON.parse(localStorage.getItem(key)!)), prefix);
}

test('successful acknowledgement dismisses but never deletes a recovered foreign writer record', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const { draft, prefix } = await draftRecord(page, created.fileName, created.version, 'Acknowledged foreign draft');
  const key = `${prefix}${draft.writerId}`;
  const stored = JSON.stringify(draft);
  await store(page, { [key]: stored });
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore draft', exact: true }).click();
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  expect(await page.evaluate(item => localStorage.getItem(item), key)).toBe(stored);
  expect(await page.evaluate(item => JSON.parse(sessionStorage.getItem(`${item}ignored`) || '[]'), prefix))
    .toContainEqual([key, stored]);
  await page.reload();
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).not.toBeVisible();
  const persisted = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
  expect(persisted.version).toBe(created.version + 1);
  expect(persisted.quiz.title).toBe('Acknowledged foreign draft');
});

test('malformed draft records do not hide later valid recovery or get deleted', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const { draft, prefix } = await draftRecord(page, created.fileName, created.version, 'Valid recovery after malformed records');
  const records = {
    [`${prefix}broken-json`]: '{not-json',
    [`${prefix}primitive-title`]: JSON.stringify({ ...draft, raw: JSON.stringify({ ...quiz(), title: 42 }) }),
    [`${prefix}mismatched-sent-version`]: JSON.stringify({
      ...draft, sent: { raw: draft.raw, version: created.version + 1 }
    }),
    [`${prefix}valid`]: JSON.stringify(draft)
  };
  await store(page, records);
  await page.route('**/admin/api/quizzes/*', route =>
    route.request().method() === 'PUT' ? route.abort('failed') : route.continue());
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#draft-warning')).toContainText(/unreadable.*untouched/i);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore draft', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Valid recovery after malformed records');
  for (const [key, value] of Object.entries(records)) {
    expect(await page.evaluate(item => localStorage.getItem(item), key), 'Foreign/malformed record retained verbatim').toBe(value);
  }
});

test('discard is tab-local and changed foreign drafts become recoverable again', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const { draft, prefix } = await draftRecord(page, created.fileName, created.version, 'Foreign draft before dismissal');
  const key = `${prefix}${draft.writerId}`;
  const original = JSON.stringify(draft);
  await store(page, { [key]: original });
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Discard drafts', exact: true }).click();
  expect(await page.evaluate(item => localStorage.getItem(item), key)).toBe(original);
  await page.reload();
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).not.toBeVisible();
  const otherTab = await page.context().newPage();
  try {
    await otherTab.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
    await expect(otherTab.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
    const changed = JSON.stringify({
      ...draft, updatedAt: draft.updatedAt + 1, raw: JSON.stringify(quiz('Changed foreign draft'))
    });
    await store(page, { [key]: changed });
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
    expect(await page.evaluate(item => localStorage.getItem(item), key)).toBe(changed);
  } finally { await otherTab.close(); }
});

for (const latestValid of [false, true]) {
  test(`delayed PUT retains newer edits and serializes saves when latest valid=${latestValid}`, async ({ page }) => {
    await authenticated(page);
    const created = await createQuiz(page);
    const { prefix } = await draftRecord(page, created.fileName, created.version, 'Unused fixture');
    await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
    await expect(page.locator('#save-status')).toContainText(/^Saved/);
    let release!: () => void;
    let received!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const firstRequest = new Promise<void>(resolve => { received = resolve; });
    const versions: number[] = [];
    let active = 0;
    let maximumActive = 0;
    await page.route('**/admin/api/quizzes/*', async route => {
      if (route.request().method() !== 'PUT') return route.continue();
      active++;
      maximumActive = Math.max(maximumActive, active);
      versions.push(route.request().postDataJSON().version);
      if (versions.length === 1) { received(); await gate; }
      const response = await route.fetch();
      active--;
      await route.fulfill({ response });
    });
    try {
      await page.getByLabel('Title', { exact: true }).fill('First in-flight revision');
      await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
      await firstRequest;
      await page.getByLabel('Title', { exact: true }).fill('Latest pending revision');
      if (!latestValid) await page.getByLabel('Description', { exact: true }).fill('');
    } finally { release(); }
    if (latestValid) {
      await expect(page.locator('#save-status')).toContainText(/^Saved/);
      expect(versions).toEqual([created.version, created.version + 1]);
      expect(maximumActive, 'Only one save may be in flight').toBe(1);
      const persisted = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
      expect(persisted.version).toBe(created.version + 2);
      expect(persisted.quiz.title).toBe('Latest pending revision');
      expect(await localDrafts(page, prefix)).toEqual([]);
    } else {
      await expect(page.locator('#save-status')).toContainText(/finish the incomplete fields/i);
      expect(versions).toEqual([created.version]);
      const drafts = await localDrafts(page, prefix);
      expect(drafts).toHaveLength(1);
      expect(drafts[0].baseVersion).toBe(created.version + 1);
      expect(JSON.parse(drafts[0].raw).title).toBe('Latest pending revision');
      expect(JSON.parse(drafts[0].raw).description).toBe('');
      const persisted = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
      expect(persisted.quiz.title).toBe('First in-flight revision');
    }
  });
}

for (const mismatch of ['revision', 'content'] as const) {
  test(`incorrect ${mismatch} acknowledgement cannot clear a pending draft`, async ({ page }) => {
    await authenticated(page);
    const created = await createQuiz(page);
    const { prefix } = await draftRecord(page, created.fileName, created.version, 'Unused fixture');
    await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
    await expect(page.locator('#save-status')).toContainText(/^Saved/);
    await page.route('**/admin/api/quizzes/*', async route => {
      if (route.request().method() !== 'PUT') return route.continue();
      const response = await route.fetch();
      const ack = await response.json();
      if (mismatch === 'revision') ack.version += 5;
      else ack.quiz.title = 'Incorrect acknowledgement content';
      await route.fulfill({ response, json: ack });
    });
    await page.getByLabel('Title', { exact: true }).fill('Pending draft must survive');
    await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
    await expect(page.locator('#save-status')).toContainText(/offline.*locally/i);
    const drafts = await localDrafts(page, prefix);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].baseVersion).toBe(created.version);
    expect(drafts[0].sent.version).toBe(created.version);
    expect(JSON.parse(drafts[0].raw).title).toBe('Pending draft must survive');
    expect((await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json()).quiz.title)
      .toBe('Pending draft must survive');
  });
}

test('lost POST acknowledgement blocks duplicate creation and preserves exportable content', async ({ page }) => {
  await authenticated(page);
  const { draft, prefix } = await draftRecord(page, null, null, 'Creation with uncertain acknowledgement');
  await store(page, { [`${prefix}${draft.writerId}`]: JSON.stringify(draft) });
  let creates = 0;
  let createdFile = '';
  await page.route('**/admin/api/quizzes', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    creates++;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    createdFile = (await response.json()).fileName;
    await route.abort('failed');
  });
  await page.goto('/editor');
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore draft', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Quiz revision conflict' })).toBeVisible();
  await expect(page.locator('#conflict-copy')).toContainText(/acknowledgement was lost.*retries are blocked/i);
  await expect(page.getByRole('dialog', { name: 'Quiz revision conflict' })
    .getByRole('button', { name: 'Export local YAML', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Keep local', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Still retained after uncertain create');
  await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('dialog', { name: 'Quiz revision conflict' })).toBeVisible();
  expect(creates).toBe(1);
  expect((await page.request.get(`/admin/api/quizzes/${createdFile}`)).ok()).toBe(true);
  expect((await localDrafts(page, prefix)).some(item =>
    JSON.parse(item.raw).title === 'Still retained after uncertain create')).toBe(true);
});

test('incomplete description fails preflight without dispatching a save', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const { prefix } = await draftRecord(page, created.fileName, created.version, 'Unused fixture');
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  let saves = 0;
  await page.route('**/admin/api/quizzes/*', route => {
    if (route.request().method() === 'PUT') saves++;
    return route.continue();
  });
  await page.getByLabel('Description', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('#details-error')).toContainText(/description before saving/i);
  expect(saves).toBe(0);
  expect(JSON.parse((await localDrafts(page, prefix))[0].raw).description).toBe('');
  expect((await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json()).version).toBe(created.version);
});

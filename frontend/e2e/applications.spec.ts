import { expect, type Page, type Route, test } from '@playwright/test'

type Status =
  'SAVED' | 'PREPARING' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'
type Company = {
  id: string
  companyName: string
  companyAddress: null
  bio: null
  websiteUrl: null
}
type Application = {
  id: string
  userId: string
  companyId: string
  position: string
  jobType: string | null
  description: string | null
  salary: number | null
  status: Status
  appliedAt: string | null
  source: string
  postingLink: string | null
  createdAt: string
  updatedAt: string | null
}
type HistoryEvent = {
  id: string
  applicationId: string
  previousStatus: Status | null
  newStatus: Status
  occurredAt: string
}

const emptyPage = <T>(content: T[], page = 0, size = 25) => ({
  content,
  number: page,
  size,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  first: true,
  last: true,
  numberOfElements: content.length,
  empty: content.length === 0,
})

class MockCareerFlowApi {
  companies: Company[] = [
    { id: 'company-acme', companyName: 'Acme', companyAddress: null, bio: null, websiteUrl: null },
  ]
  applications: Application[] = []
  applicationPosts: Record<string, unknown>[] = []
  applicationPuts: Record<string, unknown>[] = []
  histories = new Map<string, HistoryEvent[]>()

  handle(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    if (path === '/api/analytics/progress' && request.method() === 'GET') {
      return route.fulfill({ json: this.progressAnalytics(url) })
    }
    if (path.startsWith('/api/companies')) {
      return this.handleCompanies(route, url)
    }
    if (path === '/api/applications') {
      return this.handleApplicationCollection(route, url)
    }
    if (path.startsWith('/api/applications/')) {
      return this.handleApplication(route, path)
    }
    if (
      request.method() === 'GET' &&
      ['/api/followups', '/api/interviews', '/api/notes', '/api/contacts'].includes(path)
    ) {
      return route.fulfill({ json: emptyPage([]) })
    }
    return route.fulfill({ status: 404 })
  }

  private progressAnalytics(url: URL) {
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    return {
      period: {
        from,
        to,
        timezone: 'UTC',
        startInclusive: from ? `${from}T00:00:00Z` : null,
        endExclusive: '2026-10-29T00:00:00Z',
      },
      coverage: {
        instrumentedCohortCount: 3,
        legacyApplicationCount: 1,
        earliestTrackingInstant: '2026-08-01T00:00:00Z',
      },
      funnel: {
        submittedCount: 2,
        interviewingCount: 1,
        offerCount: 1,
        interviewReachAmongSubmittedCount: 1,
        offerAmongSubmittedCount: 1,
        interviewReachRate: 0.5,
        offerRate: 0.5,
      },
      activity: {
        applicationsCreated: 3,
        appliedEvents: 2,
        genuineTransitions: 4,
        daily: [
          {
            date: '2026-10-27',
            applicationsCreated: 1,
            appliedEvents: 1,
            genuineTransitions: 2,
          },
        ],
      },
      duration: { medianSubmittedToInterviewOrOfferHours: 36, sampleCount: 1 },
      definitions: {
        cohort: 'Instrumented cohort definition.',
        stageReach: 'Explicit events only.',
        rates: 'Submitted denominator.',
        activity: 'Independent activity facts.',
        duration: 'Earliest qualifying sequence.',
        dailyBuckets: 'Sparse UTC buckets.',
      },
    }
  }

  private handleCompanies(route: Route, url: URL) {
    const request = route.request()
    if (request.method() === 'GET' && url.pathname === '/api/companies') {
      const query = (url.searchParams.get('companyName') ?? '').toLowerCase()
      const matches = this.companies.filter((item) =>
        item.companyName.toLowerCase().includes(query),
      )
      return route.fulfill({ json: emptyPage(matches) })
    }
    if (request.method() === 'GET') {
      const id = decodeURIComponent(url.pathname.split('/').at(-1) ?? '')
      const company = this.companies.find((item) => item.id === id)
      return company
        ? route.fulfill({ json: company })
        : route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } })
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Omit<Company, 'id'>
      const company = { ...body, id: `company-${this.companies.length + 1}` }
      this.companies.push(company)
      return route.fulfill({ status: 201, json: company })
    }
    return route.fulfill({ status: 405 })
  }

  private handleApplicationCollection(route: Route, url: URL) {
    const request = route.request()
    if (request.method() === 'GET') {
      const status = url.searchParams.get('status')
      const position = (url.searchParams.get('position') ?? '').toLowerCase()
      const companyId = url.searchParams.get('companyId')
      const matches = this.applications.filter(
        (item) =>
          (!status || item.status === status) &&
          (!position || item.position.toLowerCase().includes(position)) &&
          (!companyId || item.companyId === companyId),
      )
      const page = Number(url.searchParams.get('page') ?? 0)
      const size = Number(url.searchParams.get('size') ?? 25)
      return route.fulfill({ json: emptyPage(matches, page, size) })
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Omit<
        Application,
        'id' | 'userId' | 'createdAt' | 'updatedAt'
      >
      this.applicationPosts.push(body)
      const application = {
        ...body,
        id: `application-${this.applications.length + 1}`,
        userId: 'owner-1',
        createdAt: '2026-10-28T08:00:00Z',
        updatedAt: null,
      }
      this.applications.push(application)
      this.histories.set(application.id, [
        {
          id: `history-${application.id}-1`,
          applicationId: application.id,
          previousStatus: null,
          newStatus: application.status,
          occurredAt: application.createdAt,
        },
      ])
      return route.fulfill({ status: 201, json: application })
    }
    return route.fulfill({ status: 405 })
  }

  private handleApplication(route: Route, path: string) {
    const request = route.request()
    const historyMatch = path.match(/^\/api\/applications\/(.+)\/history$/)
    if (request.method() === 'GET' && historyMatch) {
      const id = decodeURIComponent(historyMatch[1])
      return route.fulfill({ json: this.histories.get(id) ?? [] })
    }
    const id = decodeURIComponent(path.split('/').at(-1) ?? '')
    if (request.method() === 'PUT') {
      return this.updateApplication(route, id)
    }
    if (request.method() === 'GET') {
      const application = this.applications.find((item) => item.id === id)
      return application
        ? route.fulfill({ json: application })
        : route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } })
    }
    return route.fulfill({ status: 405 })
  }

  private updateApplication(route: Route, id: string) {
    const body = route.request().postDataJSON() as Omit<
      Application,
      'id' | 'createdAt' | 'updatedAt'
    >
    this.applicationPuts.push(body)
    const previous = this.applications.find((item) => item.id === id)
    const application = {
      ...body,
      id,
      createdAt: previous?.createdAt ?? '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T09:15:00Z',
    }
    this.applications = this.applications.map((item) => (item.id === id ? application : item))
    if (previous && previous.status !== application.status) {
      const history = this.histories.get(id) ?? []
      history.push({
        id: `history-${id}-${history.length + 1}`,
        applicationId: id,
        previousStatus: previous.status,
        newStatus: application.status,
        occurredAt: application.updatedAt,
      })
      this.histories.set(id, history)
    }
    return route.fulfill({ json: application })
  }
}

async function installApi(page: Page, api: MockCareerFlowApi) {
  await page.route('**/api/**', (route) => api.handle(route))
}

test('creates an application with a new inline company while preserving the draft', async ({
  page,
}) => {
  const api = new MockCareerFlowApi()
  await installApi(page, api)
  await page.goto('/applications')

  await page.getByRole('button', { name: 'Create first application' }).click()
  await page.getByRole('textbox', { name: 'Role *' }).fill('Platform Engineer')
  await page.getByRole('combobox', { name: 'Company *' }).fill('Nova')
  await page.getByRole('option', { name: 'Create company “Nova”' }).click()
  await expect(page.getByRole('textbox', { name: 'Role *' })).toHaveValue('Platform Engineer')
  await page.getByRole('button', { name: 'Create and select' }).click()
  await expect(page.getByRole('combobox', { name: 'Company *' })).toHaveValue('Nova')
  await page.getByRole('button', { name: 'Save application' }).click()

  await expect(page.getByRole('heading', { name: 'Platform Engineer' })).toBeVisible()
  expect(api.applicationPosts).toEqual([
    expect.objectContaining({
      companyId: 'company-2',
      position: 'Platform Engineer',
      jobType: null,
      status: 'SAVED',
    }),
  ])
})

test('persists a status change with the complete application and preserves filter URL state', async ({
  page,
}) => {
  const api = new MockCareerFlowApi()
  api.applications.push({
    id: 'application-1',
    userId: 'owner-1',
    companyId: 'company-acme',
    position: 'Backend Engineer',
    jobType: null,
    description: 'Keep this',
    salary: null,
    status: 'SAVED',
    appliedAt: null,
    source: 'Referral',
    postingLink: null,
    createdAt: '2026-10-28T08:00:00Z',
    updatedAt: null,
  })
  api.histories.set('application-1', [
    {
      id: 'history-application-1-1',
      applicationId: 'application-1',
      previousStatus: null,
      newStatus: 'SAVED',
      occurredAt: '2026-10-28T08:00:00Z',
    },
  ])
  await installApi(page, api)
  await page.goto('/applications?status=SAVED&page=4&context=qa')

  const search = page.getByRole('searchbox', { name: 'Search positions' })
  await search.fill('Backend')
  await expect(page).toHaveURL(/position=Backend/)
  await expect(page).toHaveURL(/page=1/)
  await expect(page).toHaveURL(/context=qa/)
  await page.getByLabel('Status for Backend Engineer at Acme').selectOption('APPLIED')

  await expect(page.getByText('Moved to applied.')).toBeVisible()
  expect(api.applicationPuts).toEqual([
    {
      userId: 'owner-1',
      companyId: 'company-acme',
      position: 'Backend Engineer',
      jobType: null,
      description: 'Keep this',
      salary: null,
      status: 'APPLIED',
      appliedAt: null,
      source: 'Referral',
      postingLink: null,
    },
  ])

  await page.getByRole('button', { name: 'View destination' }).click()
  await expect(page).toHaveURL(/status=APPLIED/)
  await expect(page).toHaveURL(/context=qa/)
  await page.getByRole('button', { name: 'View details' }).click()
  await expect(page.getByRole('heading', { name: 'Opportunity details' })).toBeVisible()
  await expect(page.getByText('Keep this')).toBeVisible()
  await expect(page.getByText('Status changed from Saved to Applied')).toBeVisible()
  await expect(page.getByText('Application created with initial status Saved')).toBeVisible()
})

function progressApi() {
  const api = new MockCareerFlowApi()
  const base = {
    userId: 'owner-1',
    companyId: 'company-acme',
    jobType: null,
    description: null,
    salary: null,
    source: 'QA',
    postingLink: null,
    updatedAt: null,
  }
  api.applications.push(
    {
      ...base,
      id: 'application-progress-1',
      position: 'A very long accessibility and responsive engineering opportunity title',
      status: 'INTERVIEWING',
      appliedAt: '2026-10-20',
      createdAt: '2026-10-20T00:00:00Z',
    },
    {
      ...base,
      id: 'application-progress-2',
      position: 'Offer role',
      status: 'OFFER',
      appliedAt: '2026-10-21',
      createdAt: '2026-10-21T00:00:00Z',
    },
  )
  return api
}

test('Progress preserves current-state sections and exposes keyboard-responsive historical analytics', async ({
  page,
}) => {
  const api = progressApi()
  await installApi(page, api)
  await page.setViewportSize({ width: 390, height: 640 })
  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
  await expect(page.getByText('Interviewing now').locator('..')).toContainText('1')
  await expect(page.getByText('Current offers').locator('..')).toContainText('1')
  await expect(page.getByRole('heading', { name: 'Interviews' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recruitment funnel' })).toBeVisible()
  await expect(page.getByText('50% (1 of 2)')).toHaveCount(2)
  await expect(page.getByText(/1 legacy application lack an initial tracking event/)).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('36 hours')).toBeVisible()
  const viewportOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(
        (element) => element.getBoundingClientRect().right > document.documentElement.clientWidth,
      )
      .slice(0, 5)
      .map((element) => ({
        element: element.tagName,
        right: Math.round(element.getBoundingClientRect().right),
        text: element.textContent?.trim().slice(0, 40),
      })),
  }))
  expect.soft(viewportOverflow, 'Progress must not overflow a 390px viewport').toEqual({
    clientWidth: 390,
    scrollWidth: 390,
    offenders: [],
  })

  const allHistory = page.getByRole('button', { name: 'All history' })
  await allHistory.focus()
  await page.keyboard.press('Enter')
  await expect(allHistory).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Custom' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('From')).toBeVisible()

  await page.setViewportSize({ width: 1280, height: 480 })
  await expect(
    page.getByRole('heading', { name: 'Submitted-to-next-stage duration' }),
  ).toBeVisible()
  await page.getByRole('link', { name: /^Interviewing/ }).click()
  await expect(page).toHaveURL(/\/applications\?status=INTERVIEWING/)
})

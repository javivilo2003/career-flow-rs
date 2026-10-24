import ApplicationSummarySection from '../features/dashboard/ApplicationSummarySection'
import UpcomingInterviewsSection from '../features/dashboard/UpcomingInterviewsSection'
function Dashboard() {
  return (
    <main className="p-12 text-left">
      <header className="mb-8">
        <p className="m-0 font-bold text-accent">Overview</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
          Dashboard
        </h1>
        <p className="m-0">The important parts of your job search, all in one place.</p>
      </header>

      <div className="grid grid-auto-page gap-4">
        <ApplicationSummarySection />

        <UpcomingInterviewsSection />

        <section className="rounded-2xl bg-surface p-6">
          <h2 className="m-0 mb-2 font-heading text-2xl leading-tight font-medium tracking-normal text-heading">
            Follow-ups
          </h2>
          <p className="m-0">Your pending and overdue follow-ups will appear here.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboard

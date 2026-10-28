import ApplicationSummarySection from '../features/dashboard/ApplicationSummarySection'
import InterviewStatusSection from '../features/dashboard/InterviewStatusSection'

export default function Dashboard() {
  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-10">
        <p className="m-0 font-bold text-accent">Progress</p>
        <h1 className="m-0 mt-6 mb-2 font-heading text-3xl font-medium tracking-normal text-heading sm:text-5xl">
          Progress
        </h1>
        <p className="m-0">A current snapshot of your job search.</p>
      </header>
      <div className="grid gap-6">
        <ApplicationSummarySection />
        <InterviewStatusSection />
      </div>
    </main>
  )
}

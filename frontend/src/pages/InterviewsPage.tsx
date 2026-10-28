import InterviewsWorkspace from '../features/interviews/InterviewsWorkspace'

export default function InterviewsPage() {
  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-10">
        <p className="m-0 font-bold text-accent">Interviews</p>
        <h1 className="m-0 mt-6 mb-2 font-heading text-3xl font-medium tracking-normal text-heading sm:text-5xl">
          Interviews
        </h1>
        <p className="m-0">Review scheduled interviews and your interview history.</p>
      </header>
      <InterviewsWorkspace />
    </main>
  )
}

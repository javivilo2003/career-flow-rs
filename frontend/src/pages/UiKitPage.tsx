import { type ReactNode, useState } from 'react'

import {
  AddApplicationForm,
  AddApplicationModal,
  Badge,
  type BadgeStatus,
  Button,
  Checkbox,
  DeleteApplicationContent,
  DeleteApplicationModal,
  Input,
  JobCard,
  type JobCardProps,
  Select,
  Textarea,
} from '../components'

const statuses: BadgeStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']
const options = statuses.map((value) => ({ value, label: value }))
const companyOptions = [
  { value: 'notion', label: 'Notion' },
  { value: 'linear', label: 'Linear' },
  { value: 'figma', label: 'Figma' },
  { value: 'stripe', label: 'Stripe' },
]
const jobs: Omit<JobCardProps, 'onAction' | 'onEdit' | 'onDelete'>[] = [
  {
    status: 'Saved',
    title: 'Product Designer',
    company: 'Notion',
    location: 'San Francisco, CA · Hybrid',
    applicationDate: 'Saved Oct 18, 2026',
    nextStep: 'Ready when you are. Make your next move.',
  },
  {
    status: 'Applied',
    title: 'Senior UX Designer',
    company: 'Linear',
    location: 'New York, NY · Remote',
    applicationDate: 'Applied Oct 16, 2026',
    nextStep: 'Application sent. Follow up on Oct 23.',
  },
  {
    status: 'Interview',
    title: 'Design Engineer',
    company: 'Figma',
    location: 'San Francisco, CA · Hybrid',
    applicationDate: 'Applied Oct 12, 2026',
    nextStep: 'Portfolio review · Oct 26 at 10:00 AM',
  },
  {
    status: 'Offer',
    title: 'Senior Product Designer',
    company: 'Stripe',
    location: 'London, UK · Hybrid',
    applicationDate: 'Applied Oct 5, 2026',
    nextStep: 'Offer received. Respond by Oct 30.',
  },
]
const initialValues = {
  role: 'Product Designer',
  companyId: 'notion',
  jobType: 'Full-time',
  source: 'Company site',
  salary: 120000,
  appliedAt: '2026-10-18',
  url: 'https://notion.so/careers/product-designer',
}
const deletion = {
  title: 'Product Designer',
  company: 'Notion · San Francisco, CA',
  applicationDate: 'Saved Oct 18, 2026',
}

type JobSpecimen = (typeof jobs)[number]

function Family({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="m-0 text-2xl font-bold text-heading">{title}</h2>
        <p className="m-0 text-sm text-body">{description}</p>
      </header>
      {children}
    </section>
  )
}

function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="m-0 text-xs text-body">{name}</p>
      {children}
    </div>
  )
}

function JobCardsFamily({
  onAction,
  onEdit,
  onDelete,
}: {
  onAction: (job: JobSpecimen) => void
  onEdit: () => void
  onDelete: (job: JobSpecimen) => void
}) {
  return (
    <Family
      title="Job application cards"
      description="One consistent structure, from the first save to the final offer."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {jobs.map((job) => (
          <Specimen key={job.status} name={job.status.toUpperCase()}>
            <JobCard
              {...job}
              onAction={() => onAction(job)}
              onEdit={onEdit}
              onDelete={() => onDelete(job)}
            />
          </Specimen>
        ))}
      </div>
    </Family>
  )
}

function InputsFamily() {
  return (
    <Family
      title="Text inputs"
      description="Dark inset controls, quiet labels, and guidance where it matters."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 2xl:grid-cols-5">
        <Specimen name="DEFAULT">
          <Input
            label="Job title"
            placeholder="e.g. Product Designer"
            helperText="Use the title from the job listing."
          />
        </Specimen>
        <Specimen name="FILLED">
          <Input
            label="Job title"
            defaultValue="Product Designer"
            helperText="Use the title from the job listing."
          />
        </Specimen>
        <Specimen name="FOCUS">
          <Input
            label="Job title"
            defaultValue="Product Designer"
            className="border-2 border-heading"
            helperText="Use the title from the job listing."
          />
        </Specimen>
        <Specimen name="ERROR">
          <Input
            label="Job title"
            placeholder="e.g. Product Designer"
            error="Enter a job title to continue."
          />
        </Specimen>
        <Specimen name="DISABLED">
          <Input
            label="Job title"
            defaultValue="Product Designer"
            disabled
            helperText="This application is read-only."
          />
        </Specimen>
      </div>
    </Family>
  )
}

function SelectsFamily() {
  return (
    <Family
      title="Select boxes"
      description="A contained menu keeps every option attached to its control."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <Specimen name="DEFAULT">
          <Select label="Status" options={options} />
        </Specimen>
        <Specimen name="SELECTED">
          <Select label="Status" options={options} defaultValue="Applied" />
        </Specimen>
        <Specimen name="OPEN">
          <div className="min-h-[281px]">
            <Select label="Status" options={options} defaultValue="Applied" defaultOpen />
          </div>
        </Specimen>
        <Specimen name="DISABLED">
          <Select label="Status" options={options} defaultValue="Applied" disabled />
        </Specimen>
      </div>
    </Family>
  )
}

function TextareasFamily() {
  return (
    <Family
      title="Textareas"
      description="Room for context, with clear limits and actionable validation."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Specimen name="DEFAULT">
          <Textarea
            label="Notes"
            placeholder="Add interview details, contacts, or a reminder for your next step…"
            helperText="Optional · Up to 1,000 characters"
          />
        </Specimen>
        <Specimen name="ERROR">
          <Textarea
            label="Notes"
            defaultValue="Portfolio review with the design team. Prepare case studies, research notes, and questions about the role…"
            error="Notes are 42 characters over the limit. Shorten to 1,000 characters or fewer."
          />
        </Specimen>
      </div>
    </Family>
  )
}

const buttonLabels = {
  primary: 'Save application',
  secondary: 'Cancel',
  destructive: 'Delete application',
  disabled: 'Save application',
} as const

type ButtonSpecimen = keyof typeof buttonLabels

function ButtonsFamily({ onAction }: { onAction: (variant: ButtonSpecimen) => void }) {
  const variants = Object.keys(buttonLabels) as ButtonSpecimen[]

  return (
    <Family
      title="Buttons"
      description="Clear actions without introducing a brighter accent palette."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {variants.map((variant) => (
          <Specimen key={variant} name={variant.toUpperCase()}>
            <div className="rounded-[10px] bg-surface p-5">
              <Button
                className="w-full"
                variant={variant === 'disabled' ? 'primary' : variant}
                disabled={variant === 'disabled'}
                onClick={() => onAction(variant)}
              >
                {buttonLabels[variant]}
              </Button>
            </div>
          </Specimen>
        ))}
      </div>
    </Family>
  )
}

function BadgesAndCheckboxes() {
  return (
    <div className="flex flex-wrap gap-16">
      <Family
        title="Status badges"
        description="Quiet, readable signals across the application pipeline."
      >
        <div className="flex flex-wrap gap-5">
          {statuses.map((status) => (
            <Badge key={status} status={status} />
          ))}
        </div>
      </Family>
      <Family title="Checkboxes" description="Supporting selection controls.">
        <div className="flex flex-wrap gap-8">
          <Checkbox label="Set a reminder" />
          <Checkbox label="Set a reminder" defaultChecked />
        </div>
      </Family>
    </div>
  )
}

function ModalsFamily({
  onAdd,
  onDelete,
  onNotice,
}: {
  onAdd: () => void
  onDelete: () => void
  onNotice: (notice: string) => void
}) {
  return (
    <Family
      title="Modals"
      description="Focused tasks on familiar slate surfaces. Complete content, contained actions."
    >
      <div className="flex flex-wrap items-start gap-12">
        <Specimen name="ADD APPLICATION">
          <AddApplicationForm
            initialValues={initialValues}
            companyOptions={companyOptions}
            onClose={() => onNotice('Cancelled preview form.')}
            onSubmit={() => onNotice('Preview saved. No application data was sent.')}
          />
        </Specimen>
        <Specimen name="DELETE CONFIRMATION">
          <DeleteApplicationContent
            {...deletion}
            onClose={onNotice.bind(null, 'Cancelled preview deletion.')}
            onDelete={onDelete}
          />
        </Specimen>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onAdd}>
          Open add dialog
        </Button>
        <Button variant="secondary" onClick={onDelete}>
          Open delete dialog
        </Button>
      </div>
    </Family>
  )
}

export default function UiKitPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [deleteJob, setDeleteJob] = useState<JobSpecimen | null>(null)
  const [notice, setNotice] = useState('')

  function handleButtonAction(variant: ButtonSpecimen) {
    if (variant === 'destructive') {
      setDeleteJob(jobs[0])
      return
    }
    if (variant === 'primary') {
      setAddOpen(true)
      return
    }
    setNotice('Cancelled preview action.')
  }

  return (
    <main className="mx-auto flex max-w-[1840px] flex-col gap-12 p-6 text-left leading-normal sm:p-16">
      <header className="flex flex-col gap-3">
        <p className="m-0 text-sm text-body">CAREERFLOW / UI KIT</p>
        <h1 className="m-0 text-[40px] font-bold text-heading">A calmer way to move forward.</h1>
        <p className="m-0 text-base text-secondary">
          Reusable building blocks for your application journey. Based on the Applications page.
        </p>
      </header>
      <JobCardsFamily
        onAction={(job) => setNotice(`${job.title}: ${job.nextStep}`)}
        onEdit={() => setAddOpen(true)}
        onDelete={setDeleteJob}
      />
      <InputsFamily />
      <SelectsFamily />
      <TextareasFamily />
      <ButtonsFamily onAction={handleButtonAction} />
      <BadgesAndCheckboxes />
      <ModalsFamily
        onAdd={() => setAddOpen(true)}
        onDelete={() => setDeleteJob(jobs[0])}
        onNotice={setNotice}
      />
      <p role="status" className="m-0 text-sm text-secondary">
        {notice || 'Interactive previews use sample data.'}
      </p>
      <AddApplicationModal
        open={addOpen}
        initialValues={initialValues}
        companyOptions={companyOptions}
        onClose={() => setAddOpen(false)}
        onSubmit={() => {
          setNotice('Preview saved. No application data was sent.')
          setAddOpen(false)
        }}
      />
      <DeleteApplicationModal
        open={deleteJob !== null}
        title={deleteJob?.title ?? ''}
        company={deleteJob?.company ?? ''}
        applicationDate={deleteJob?.applicationDate ?? ''}
        onClose={() => setDeleteJob(null)}
        onDelete={() => {
          setNotice('Preview deletion confirmed. No application data was removed.')
          setDeleteJob(null)
        }}
      />
    </main>
  )
}

'use client'

import { useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Coins,
  FileCheck,
  Gift,
  HandCoins,
  Landmark,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Users,
} from 'lucide-react'

// ---------- Data ----------

const steps = [
  { icon: Camera, title: 'Share an item', copy: 'Upload a photo of your old device — our AI looks at what it is and its visible condition.' },
  { icon: Sparkles, title: 'AI price estimate', copy: 'The system instantly shows a transparent starting price range based on the item and market data.' },
  { icon: CircleHelp, title: 'Answer condition questions', copy: 'Device-specific questions (working? cracked? complete?) refine the estimate to a final fixed price.' },
  { icon: Landmark, title: 'Government approval', copy: 'Nagar Nigam reviews the verified request and locks the approved price — this is the price you get.' },
  { icon: Truck, title: 'Collector dispatched', copy: 'The nearest registered kabadiwala gets an SMS (or a voice call if illiterate) with your pickup details.' },
  { icon: PackageCheck, title: 'Drop-point check & payout', copy: 'Item is verified at the drop point against your photo and condition. On match, payment is released instantly.' },
]

const estimatorItems = [
  { id: 'laptop', label: 'Laptop / Computer', base: 850, watt: 30 },
  { id: 'mobile', label: 'Mobile Phone', base: 250, watt: 10 },
  { id: 'fridge', label: 'Refrigerator', base: 1200, watt: 120 },
  { id: 'ac', label: 'Air Conditioner', base: 1500, watt: 140 },
  { id: 'tv', label: 'Television', base: 600, watt: 35 },
  { id: 'copper', label: 'Copper / Wiring', base: 400, watt: 8 },
]

const conditions = [
  { id: 'working', label: 'Works fine (minor wear)', mult: 1.0 },
  { id: 'not-working', label: 'Not working / dead', mult: 0.7 },
  { id: 'damaged', label: 'Damaged / incomplete', mult: 0.45 },
]

const ages = [
  { id: 'under2', label: 'Less than 2 years', mult: 1.1 },
  { id: '2to5', label: '2–5 years', mult: 1.0 },
  { id: '5to8', label: '5–8 years', mult: 0.85 },
  { id: 'over8', label: 'More than 8 years', mult: 0.65 },
]

const faqs = [
  {
    q: 'How is the price decided?',
    a: 'Our AI scrapes government rate charts and live market data to propose a starting estimate. After you answer a few condition questions, the request goes to Nagar Nigam, who reviews and locks the final fixed price — legally binding and fair for both sides.',
  },
  {
    q: 'What happens if the collector does not read SMS?',
    a: 'For every registered collector we store their literacy preference. Literate collectors receive an SMS dispatch. Illiterate collectors automatically get a pre-recorded voice call in their local language with the pickup address and time.',
  },
  {
    q: 'How does the drop-point verification work?',
    a: 'The collector drops all items at the nearest government drop point. An inspector compares each item against the seller’s uploaded photo and condition answers. Only items that match 100% trigger the payout to the seller.',
  },
  {
    q: 'What if the item does not match?',
    a: 'If the item fails verification, it is returned to the drop point and the request is re-assessed. The seller is informed and no payment is released for that item — keeping the system honest for everyone.',
  },
  {
    q: 'Do collectors / transporters earn anything?',
    a: 'Yes. Each verified pickup pays the collector a transport commission, and drop points earn a handling fee from buyers. Sellers earn government reward points on top of their payout, which can be redeemed for civic benefits like BBMP tax rebates.',
  },
  {
    q: 'Is my data shared with strangers?',
    a: 'Never. Your address and phone are only shared with the government-approved collector assigned to your pickup — after you accept the fixed price.',
  },
]

// ---------- Helper ----------

function formatINR(amount: number) {
  return '₹' + amount.toLocaleString('en-IN')
}

// ---------- Page ----------

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [listingStep, setListingStep] = useState(0) // 0=form, 1=analyzing, 2=result+questions, 3=approved
  const [loading, setLoading] = useState(false)
  const [detectedItem, setDetectedItem] = useState('')
  const [aiEstimate, setAiEstimate] = useState({ min: 0, max: 0 })
  const [conditionAnswers, setConditionAnswers] = useState<Record<string, string>>({})

  // Estimator state
  const [estItem, setEstItem] = useState(estimatorItems[0])
  const [estCondition, setEstCondition] = useState(conditions[0])
  const [estAge, setEstAge] = useState(ages[1])
  const [showEstimate, setShowEstimate] = useState(false)

  // Government stepper
  const [govStep, setGovStep] = useState(0)
  const govStages = [
    { label: 'Request submitted', desc: 'Listed item + AI estimate + your answers sent.' },
    { label: 'Nagar Nigam review', desc: 'Authorities verify the photo, item and price.' },
    { label: 'Price approved', desc: 'Fixed price locked — you accept, request goes live.' },
    { label: 'Collector dispatched', desc: 'SMS / voice call sent to the nearest kabadiwala.' },
  ]

  // Collector simulation
  const [collectorMode, setCollectorMode] = useState<'sms' | 'call'>('sms')
  const [collectorFired, setCollectorFired] = useState(false)

  // Drop-point verification checklist
  const [checks, setChecks] = useState([false, false, false])
  const checkLabels = ['Item matches seller photo', 'Condition matches answers given', 'Quantity / weight verified']
  const allChecked = checks.every(Boolean)

  // Rewards
  const [points, setPoints] = useState(0)

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const item = String(form.get('item') || '').trim()
    const location = String(form.get('location') || '').trim()
    if (!item || !location) return

    setListingStep(1) // analyzing
    setLoading(true)

    // Simulate AI photo analysis
    setTimeout(() => {
      const lower = item.toLowerCase()
      let detected = 'Electronic device'
      let base = 500
      if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) {
        detected = 'Laptop / Computer'
        base = 850
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('iphone')) {
        detected = 'Mobile Phone'
        base = 250
      } else if (lower.includes('fridge') || lower.includes('refrigerator')) {
        detected = 'Refrigerator'
        base = 1200
      } else if (lower.includes('ac') || lower.includes('air condition')) {
        detected = 'Air Conditioner'
        base = 1500
      } else if (lower.includes('tv') || lower.includes('television')) {
        detected = 'Television'
        base = 600
      } else if (lower.includes('copper') || lower.includes('wire') || lower.includes('cable')) {
        detected = 'Copper / Wiring'
        base = 400
      }

      setDetectedItem(detected)
      setAiEstimate({ min: Math.round(base * 0.7), max: Math.round(base * 1.1) })
      setListingStep(2) // show result + questions
      setLoading(false)
      setPoints((p) => p + 10)
    }, 1800)
  }

  function sendToGovernment() {
    setListingStep(3)
    setPoints((p) => p + 20)
  }

  function resetListing() {
    setListingStep(0)
    setDetectedItem('')
    setAiEstimate({ min: 0, max: 0 })
    setConditionAnswers({})
    setFileName('')
  }

  // Derived estimator price
  const estimatedMin = Math.round(estItem.base * estCondition.mult * estAge.mult)
  const estimatedMax = Math.round(estimatedMin * 1.25)
  const estimatePct = Math.min(100, Math.max(15, (estItem.base / 1500) * 100))

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Recycle className="size-5" />
            </span>
            ScrapeConnect{' '}
            <span className="hidden text-muted-foreground sm:inline">/ verified e-waste platform</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#estimator" className="transition-colors hover:text-foreground">AI estimator</a>
            <a href="#collectors" className="transition-colors hover:text-foreground">For collectors</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            <a href="#sell" className="rounded-full bg-secondary px-4 py-2 font-medium text-secondary-foreground">List an item</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <Gift className="size-3.5 text-primary" /> {points} pts
            </span>
            <button className="rounded-full border border-border p-2.5 text-muted-foreground md:hidden" aria-label="Open notifications">
              <Bell className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section id="top" className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" /> Government-verified circular network
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Turn old things into a cleaner <span className="text-primary">tomorrow.</span>
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
            Snap a photo. Get a fair, government-approved price in minutes. A verified collector comes
            to your door, and you earn cash <em>plus</em> reward points.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#sell" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">
              List your e-waste <ArrowRight className="size-4" />
            </a>
            <a href="#estimator" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Try the AI estimator <ChevronRight className="size-4" />
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Verified buyers</span>
            <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Local pickup</span>
            <span className="flex items-center gap-2"><Coins className="size-4 text-primary" /> Reward points</span>
          </div>
        </div>

        {/* Listing form */}
        <div id="sell" className="relative rounded-[2rem] border border-border bg-card p-4 shadow-[0_24px_80px_-32px_hsl(var(--primary)/.35)] sm:p-6">
          <div className="rounded-[1.5rem] bg-secondary/65 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Start a listing</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Tell us what you want to recycle.</p>
              </div>
              <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">Step 1 of 3</span>
            </div>

            {listingStep === 0 && (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block text-sm font-medium">
                  What are you selling?
                  <input name="item" required placeholder="e.g. old laptop, copper wire" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
                </label>

                <div>
                  <p className="text-sm font-medium">Add a photo</p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-card px-4 py-4 text-left transition-colors hover:border-primary"
                  >
                    <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                      <Upload className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{fileName || 'Upload an item photo'}</span>
                      <span className="block text-xs text-muted-foreground">PNG or JPG, up to 10 MB</span>
                    </span>
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    name="photo"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(event) => setFileName(event.target.files?.[0]?.name || '')}
                  />
                </div>

                <label className="block text-sm font-medium">
                  Your area
                  <input name="location" required placeholder="City or PIN code" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
                </label>

                <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {loading ? 'Saving listing…' : 'Get my estimate'} <ArrowRight className="size-4" />
                </button>
                <p className="text-center text-xs leading-5 text-muted-foreground">
                  No commitment. Your details are only shared with verified partners.
                </p>
              </form>
            )}

            {listingStep === 1 && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto grid size-14 animate-pulse place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">AI is analyzing your item…</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Detecting item type, visible condition and estimating market value…
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
                </div>
              </div>
            )}

            {listingStep === 2 && (
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">AI analysis complete</p>
                      <p className="text-xs text-muted-foreground">Detected: {detectedItem}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated value</p>
                      <p className="mt-1 text-2xl font-semibold">{formatINR(aiEstimate.min)} – {formatINR(aiEstimate.max)}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">AI confidence 92%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold">Confirm condition details</p>
                  <p className="mt-1 text-xs text-muted-foreground">These answers refine your final price.</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { key: 'working', q: 'Is it in working condition?' },
                      { key: 'complete', q: 'Are all parts / accessories included?' },
                      { key: 'damage', q: 'Any visible damage (cracks, rust)?' },
                    ].map(({ key, q }) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground">{q}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setConditionAnswers((prev) => ({ ...prev, [key]: opt }))}
                              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${conditionAnswers[key] === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={sendToGovernment}
                  disabled={Object.keys(conditionAnswers).length < 3}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${Object.keys(conditionAnswers).length >= 3 ? 'bg-primary text-primary-foreground hover:-translate-y-0.5' : 'cursor-not-allowed bg-secondary text-muted-foreground'}`}
                >
                  <Landmark className="size-4" /> Send to Nagar Nigam for approval
                </button>
              </div>
            )}

            {listingStep === 3 && (
              <div className="mt-8 rounded-2xl border border-primary/20 bg-card p-6">
                <div className="mb-3 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <BadgeCheck className="size-5" />
                </div>
                <h2 className="text-xl font-semibold">Price approved by Nagar Nigam!</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your <span className="font-medium text-foreground">{detectedItem}</span> is approved at{' '}
                  <span className="font-semibold text-primary">{formatINR(aiEstimate.min)}</span>. A verified
                  collector will be dispatched to your area shortly. +20 points earned!
                </p>
                <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approval ref</span>
                    <span className="font-semibold">#EW-{25765 + Math.floor(Math.random() * 1000)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Fixed price</span>
                    <span className="font-semibold text-primary">{formatINR(aiEstimate.min)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Collector</span>
                    <span className="font-semibold">Dispatched via SMS ✓</span>
                  </div>
                </div>
                <button onClick={resetListing} className="mt-5 text-sm font-semibold text-primary">
                  List another item
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-primary">A better handoff</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              From cluttered corner to circular economy — with government oversight at every step.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="border-l border-border pl-5">
                <Icon className="size-5 text-primary" />
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- AI Estimator ---------- */}
      <section id="estimator" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">AI price estimator</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Know what it's worth before you lift a finger.
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-7 text-muted-foreground">
              Pick your item type, its condition ratio, and age — our prototype model will show you
              the transparent estimate range the government & verified buyers use. This is just a
              preview of the full AI photo-analysis experience.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium">Item type</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {estimatorItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setEstItem(item); setShowEstimate(false) }}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${estItem.id === item.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-medium">Condition</p>
              <div className="mt-3 space-y-2">
                {conditions.map((cond) => (
                  <label key={cond.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="condition"
                      checked={estCondition.id === cond.id}
                      onChange={() => { setEstCondition(cond); setShowEstimate(false) }}
                      className="size-4 accent-(--primary)"
                    />
                    {cond.label}
                  </label>
                ))}
              </div>

              <p className="mt-6 text-sm font-medium">How old is it?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ages.map((age) => (
                  <button
                    key={age.id}
                    onClick={() => { setEstAge(age); setShowEstimate(false) }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${estAge.id === age.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setShowEstimate(true); setPoints((p) => p + 5) }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="size-4" /> Get my estimate
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold">AI Assessment</p>
                  <p className="text-xs text-muted-foreground">Preview model · prototype</p>
                </div>
              </div>

              {showEstimate ? (
                <div className="mt-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated range</p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight">
                        {formatINR(estimatedMin)} – {formatINR(estimatedMax)}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {estCondition.mult === 1 ? 'Working' : estCondition.mult === 0.7 ? 'Not working' : 'Damaged'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>₹0</span>
                      <span>₹1,500+</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${Math.min(100, (estimatedMin / 1500) * 100 + estimatePct * 0.3)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-7 space-y-2.5">
                    {[
                      `Item: ${estItem.label}`,
                      `Condition: ${estCondition.label}`,
                      `Age: ${estAge.label}`,
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-4 text-primary" /> {line}
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-2xl bg-secondary/60 p-4 text-sm leading-6 text-muted-foreground">
                    If you accept this estimate, you'll be asked a few condition questions (working?
                    cracked? all parts included?), then we send it to{' '}
                    <span className="font-medium text-foreground">Nagar Nigam</span> for final price approval.
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-border p-5 text-center">
                  <Truck className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Set the options on the left and hit <span className="font-medium text-foreground">Get my estimate</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Government Approval ---------- */}
      <section id="government" className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Verified pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The price you see is the price the government locks in.
            </h2>
            <p className="mt-4 text-pretty leading-7 text-muted-foreground">
              No haggling, no last-minute "it's rusted so less". Your fixed price is
              approved by Nagar Nigam before the collector ever leaves home. Simulate the flow below.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Stepper */}
            <div className="space-y-2">
              {govStages.map((stage, i) => (
                <button
                  key={stage.label}
                  onClick={() => setGovStep(i)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${govStep === i ? 'border-primary bg-card' : 'border-border bg-background hover:border-primary/30'}`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${i <= govStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {i < govStep ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${govStep >= i ? 'text-foreground' : 'text-muted-foreground'}`}>{stage.label}</p>
                    <p className={`mt-1 text-sm leading-6 ${govStep === i ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>{stage.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Landmark className="size-5" /></span>
                  <div>
                    <p className="text-sm font-semibold">Nagar Nigam e-waste desk</p>
                    <p className="text-xs text-muted-foreground">Government of India · city division</p>
                  </div>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                  Approval ref: #EW-{25765 + govStep * 137}
                </span>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
                  <FileCheck className="size-4 shrink-0 text-primary" />
                  <span>AI estimate: <span className="font-semibold text-foreground">{formatINR(estimatedMin)} – {formatINR(estimatedMax)}</span></span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
                  <Users className="size-4 shrink-0 text-primary" />
                  <span>Verified buyer: <span className="font-semibold text-foreground">GreenMetal Recyclers Pvt. Ltd.</span></span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span>Pickup zone: <span className="font-semibold text-foreground">Ward 42 — Koramangala</span></span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-semibold text-primary">Current stage: {govStages[govStep].label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{govStages[govStep].desc}</p>
              </div>

              <button
                onClick={() => {
                  if (govStep >= govStages.length - 1) {
                    setGovStep(0)
                  } else {
                    setGovStep((s) => s + 1)
                    setPoints((p) => p + 3)
                  }
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {govStep >= govStages.length - 1 ? 'Reset simulation' : 'Advance approval step'} <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Collectors ---------- */}
      <section id="collectors" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">For collectors & kabadiwalas</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Every pickup is a guaranteed, government-backed job.
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-7 text-muted-foreground">
              No more wandering and guessing. Nagar Nigam dispatches you directly to verified sellers.
              Literate collectors get an SMS with the address and time. Others get a voice call — in
              their own language. Both earn a fixed transport commission per successful pickup.
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium">How would you like to receive pickups?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setCollectorMode('sms'); setCollectorFired(false) }}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${collectorMode === 'sms' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  <MessageSquare className="size-4" /> SMS (literate)
                </button>
                <button
                  onClick={() => { setCollectorMode('call'); setCollectorFired(false) }}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${collectorMode === 'call' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  <Phone className="size-4" /> Voice call (illiterate)
                </button>
              </div>

              <button
                onClick={() => { setCollectorFired(true); setPoints((p) => p + 5) }}
                disabled={collectorFired}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Truck className="size-4" /> {collectorFired ? 'Dispatch sent' : 'Simulate dispatch'}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              {collectorFired ? (
                collectorMode === 'sms' ? (
                  <div className="mx-auto max-w-sm">
                    <div className="rounded-2xl bg-secondary/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New pickup assignment · Nagar Nigam</p>
                      <div className="mt-4 rounded-2xl bg-background p-4 text-sm leading-6">
                        <p className="font-semibold">📦 Pickup #EW-25765</p>
                        <p className="mt-2 text-muted-foreground">
                          Address: 12, 4th Cross, Koramangala · 10:30 AM Tuesday<br />
                          Item: Laptop (not working) · Verify at drop point CD-7<br />
                          Commission: ₹120 + ₹5/km
                        </p>
                        <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                          Reply OK to confirm pickup
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-xs text-muted-foreground">SMS delivered to +91 98•• •••541</p>
                  </div>
                ) : (
                  <div className="mx-auto max-w-sm">
                    <div className="rounded-2xl bg-secondary/70 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Automated voice call · local language</p>
                      <div className="mt-4 rounded-2xl bg-background p-4 text-sm leading-6">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 animate-pulse place-items-center rounded-full bg-primary/15 text-primary"><Phone className="size-4" /></span>
                          <div>
                            <p className="font-semibold">Calling +91 98•• •••541…</p>
                            <p className="text-xs text-muted-foreground">Recording: "Namaste! Aapke liye ek pickup hai…"</p>
                          </div>
                        </div>
                        <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                          Press 1 to accept · Press 2 to decline
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-xs text-muted-foreground">Works even if the collector cannot read or write.</p>
                  </div>
                )
              ) : (
                <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-border p-8 text-center">
                  <div>
                    <Truck className="mx-auto size-10 text-muted-foreground/40" />
                    <p className="mt-4 text-sm font-medium text-foreground">No active dispatches</p>
                    <p className="mt-1 text-sm text-muted-foreground">Hit <span className="font-medium">"Simulate dispatch"</span> to see how a pickup assignment looks.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Drop-point Verification ---------- */}
      <section id="verification" className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">Drop-point verification</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Payment only after the drop-point checks pass.
              </h2>
              <p className="mt-4 max-w-md text-pretty leading-7 text-muted-foreground">
                All e-waste lands at a central government drop point. Our inspectors compare the
                physical item against the seller's photo and answers. If everything matches →
                payment released. If not → item is returned and the price is re-quoted.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-medium">Try the verification checklist</p>
                <div className="mt-4 space-y-3">
                  {checkLabels.map((label, i) => (
                    <label key={label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={checks[i]}
                        onChange={() => {
                          const next = [...checks]
                          next[i] = !next[i]
                          setChecks(next)
                        }}
                        className="size-4 accent-(--primary)"
                      />
                      <span className={checks[i] ? 'font-medium text-foreground' : 'text-muted-foreground'}>{label}</span>
                      {checks[i] && <CheckCircle2 className="ml-auto size-4 text-primary" />}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => { setPoints((p) => p + 15) }}
                  disabled={!allChecked}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${allChecked ? 'bg-primary text-primary-foreground hover:-translate-y-0.5' : 'cursor-not-allowed bg-secondary text-muted-foreground'}`}
                >
                  <Banknote className="size-4" /> {allChecked ? 'Release seller payment' : 'Complete all checks to release payment'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><PackageCheck className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold">Drop Point CD-7 · Hebbal</p>
                  <p className="text-xs text-muted-foreground">Government verified collection centre</p>
                </div>
              </div>

              <div className={`mt-8 rounded-2xl p-5 ${allChecked ? 'border border-primary/30 bg-primary/10' : 'border border-border bg-secondary/50'}`}>
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 place-items-center rounded-full ${allChecked ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
                    {allChecked ? <CheckCircle2 className="size-5" /> : <ShieldCheck className="size-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{allChecked ? 'Verification passed' : 'Awaiting inspection'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {allChecked
                        ? 'Inspector Rajesh Kumar approved the item. UPI payment of ₹540 sent to seller.'
                        : 'The inspector still needs to sign off on all item checks.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Seller payout ({formatINR(estimatedMin)})</span>
                  <span className={`font-semibold ${allChecked ? 'text-primary' : 'text-muted-foreground'}`}>{allChecked ? 'Paid ✓' : 'Pending'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collector commission</span>
                  <span className={`font-semibold ${allChecked ? 'text-primary' : 'text-muted-foreground'}`}>{allChecked ? '₹120 paid ✓' : 'Pending'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Drop-point handling fee</span>
                  <span className={`font-semibold ${allChecked ? 'text-primary' : 'text-muted-foreground'}`}>{allChecked ? '₹35 paid ✓' : 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Benefits / Rewards ---------- */}
      <section id="benefits" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Rewards that add up</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Sell waste, earn city benefits.
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-7 text-muted-foreground">
              Every verified sale adds <span className="font-semibold text-foreground">green points</span>{' '}
              to your civic profile. Redeem them for property-tax rebates, water-bill discounts or bus
              passes — a small government nudge to keep everyone recycling.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#sell" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
                Start earning points <ArrowRight className="size-4" />
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Your green balance</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Lifetime</span>
            </div>
            <div className="mt-5 flex items-end gap-4">
              <p className="text-5xl font-semibold tracking-tight">{points}</p>
              <p className="pb-1.5 text-sm text-muted-foreground">green points</p>
            </div>

            <div className="mt-4 rounded-2xl bg-secondary/60 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Laptop recycled</span>
                <span className="font-semibold text-primary">+ 25 pts</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>BBMP e-waste drive bonus</span>
                <span className="font-semibold text-primary">+ 10 pts</span>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target for ₹500 tax rebate</span>
                  <span className="font-semibold text-foreground">{Math.min(100, (points / 100) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (points / 100) * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
              <HandCoins className="size-4 shrink-0 text-primary" />
              <span>Every simulation action on this page adds points. Try them all!</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Trust / Stats ---------- */}
      <section id="trust" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-semibold text-primary">Built for trust</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Good for your home. Better for your city.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-3xl font-semibold">100%</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">verified partner network</p>
          </div>
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-3xl font-semibold">₹0</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">listing fee for households</p>
          </div>
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-3xl font-semibold">1 goal</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">less waste in landfills</p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-primary">Questions, answered</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you're wondering.</h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold">{faq.q}</span>
                  <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Recycle className="size-4 text-primary" /> ScrapeConnect
          </span>
          <span>Making responsible recycling feel simple — with the government by your side.</span>
          <span>© 2026 ScrapeConnect Network</span>
        </div>
      </footer>
    </main>
  )
}
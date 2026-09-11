'use client'

import { useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, Bell, Camera, ChevronRight, CircleHelp, MapPin, PackageCheck, Recycle, ShieldCheck, Sparkles, Truck, UploadCloud } from 'lucide-react'

const steps = [
  { icon: Camera, title: 'Share an item', copy: 'Upload a photo and tell us a little about your recyclable.' },
  { icon: Sparkles, title: 'Get a fair estimate', copy: 'Our smart assessment gives you a transparent starting price.' },
  { icon: Truck, title: 'We arrange pickup', copy: 'A verified local collector receives the approved request.' },
  { icon: PackageCheck, title: 'Earn & recycle', copy: 'Get paid after a drop-point check confirms the item.' },
]

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    form.append('photoName', fileName)
    try {
      await fetch('/api/listings', { method: 'POST', body: form })
      setSubmitted(true)
      event.currentTarget.reset()
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Recycle className="size-5" /></span>
          ScrapeConnect <span className="hidden text-muted-foreground sm:inline">/ verified recycling</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#trust" className="transition-colors hover:text-foreground">Why ScrapeConnect</a>
          <a href="#sell" className="rounded-full bg-secondary px-4 py-2 font-medium text-secondary-foreground">List an item</a>
        </nav>
        <button className="rounded-full border border-border p-2.5 text-muted-foreground md:hidden" aria-label="Open notifications"><Bell className="size-4" /></button>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><BadgeCheck className="size-3.5 text-primary" /> Government-verified circular network</div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Turn old things into a cleaner <span className="text-primary">tomorrow.</span></h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">ScrapeConnect connects households with verified buyers and local collectors, so every old device finds its next useful life — and you get a fair, safe payout.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#sell" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">List your e-waste <ArrowRight className="size-4" /></a>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">See how it works <ChevronRight className="size-4" /></a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Verified buyers</span><span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Local pickup</span><span className="flex items-center gap-2"><CircleHelp className="size-4 text-primary" /> Transparent pricing</span></div>
        </div>

        <div id="sell" className="relative rounded-[2rem] border border-border bg-card p-4 shadow-[0_24px_80px_-32px_hsl(var(--primary)/.35)] sm:p-6">
          <div className="rounded-[1.5rem] bg-secondary/65 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Start a listing</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Tell us what you want to recycle.</p></div><span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">Step 1 of 3</span></div>
            {submitted ? <div className="mt-8 rounded-2xl border border-primary/20 bg-card p-6"><div className="mb-3 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><BadgeCheck className="size-5" /></div><h2 className="text-xl font-semibold">Listing received</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">We saved your item. A verified assessment will be ready after you add its condition details.</p><button onClick={() => setSubmitted(false)} className="mt-5 text-sm font-semibold text-primary">List another item</button></div> : <form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block text-sm font-medium">What are you selling?<input name="item" required placeholder="e.g. old laptop, copper wire" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" /></label><div><p className="text-sm font-medium">Add a photo</p><button type="button" onClick={() => inputRef.current?.click()} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-card px-4 py-4 text-left transition-colors hover:border-primary"><span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><UploadCloud className="size-5" /></span><span><span className="block text-sm font-medium">{fileName || 'Upload an item photo'}</span><span className="block text-xs text-muted-foreground">PNG or JPG, up to 10 MB</span></span></button><input ref={inputRef} type="file" name="photo" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} /></div><label className="block text-sm font-medium">Your area<input name="location" required placeholder="City or PIN code" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" /></label><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Saving listing…' : 'Get my estimate'} <ArrowRight className="size-4" /></button><p className="text-center text-xs leading-5 text-muted-foreground">No commitment. Your details are only shared with verified partners.</p></form>}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card/50"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className="max-w-xl"><p className="text-sm font-semibold text-primary">A better handoff</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From cluttered corner to circular economy.</h2></div><div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ icon: Icon, title, copy }) => <div key={title} className="border-l border-border pl-5"><Icon className="size-5 text-primary" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}</div></div></section>

      <section id="trust" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-24"><div><p className="text-sm font-semibold text-primary">Built for trust</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Good for your home. Better for your city.</h2></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-secondary p-5"><p className="text-3xl font-semibold">100%</p><p className="mt-2 text-sm leading-6 text-muted-foreground">verified partner network</p></div><div className="rounded-2xl bg-secondary p-5"><p className="text-3xl font-semibold">₹0</p><p className="mt-2 text-sm leading-6 text-muted-foreground">listing fee for households</p></div><div className="rounded-2xl bg-secondary p-5"><p className="text-3xl font-semibold">1 goal</p><p className="mt-2 text-sm leading-6 text-muted-foreground">less waste in landfills</p></div></div></section>

      <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span className="font-medium text-foreground">ScrapeConnect</span><span>Making responsible recycling feel simple.</span><span>© 2026 ScrapeConnect Network</span></div></footer>
    </main>
  )
}

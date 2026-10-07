export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-900">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Care administration</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Doctor Tracker</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">A central place to manage doctors, their patients, and the insights that connect them.</p>
        <div className="mt-8 rounded-xl bg-teal-50 p-5 text-sm leading-6 text-teal-900">Project foundation is ready. Login, doctor management, patient management, and dashboard analytics will be added next.</div>
      </section>
    </main>
  );
}

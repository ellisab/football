import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="poster-shell min-h-screen w-full overflow-x-hidden text-[#fff2fb]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-[#ff9953]/18 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute right-[-12%] top-52 h-72 w-72 rounded-full bg-[#57ebff]/12 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#ff5c9a]/14 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-3 pb-14 pt-5 sm:px-5 sm:pb-20 sm:pt-6">
        <section className="poster-surface grid gap-4 rounded-[1.8rem] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32 rounded-full bg-white/10" />
            <Skeleton className="h-9 w-36 rounded-full bg-white/8" />
            <Skeleton className="h-9 w-28 rounded-full bg-white/8" />
          </div>
        </section>

        <section className="hero-panel grid gap-6 overflow-hidden rounded-[2.3rem] border border-white/10 px-5 py-6 sm:px-7 sm:py-8">
          <Skeleton className="h-5 w-32 rounded-full bg-[#ffd66c]/18" />
          <div className="grid gap-3">
            <Skeleton className="h-14 w-full max-w-[34rem] bg-white/12 sm:h-16" />
            <Skeleton className="h-5 w-full max-w-[28rem] bg-white/8" />
            <Skeleton className="h-5 w-full max-w-[22rem] bg-white/8" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-40 rounded-full bg-white/12" />
            <Skeleton className="h-12 w-36 rounded-full bg-white/8" />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(39,14,47,0.88),rgba(22,9,31,0.96))] py-0 shadow-none">
            <CardHeader className="gap-3">
              <Skeleton className="h-6 w-48 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/6" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-[1.5rem] bg-white/8" />
              ))}
            </CardContent>
          </Card>
          <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(39,14,47,0.88),rgba(22,9,31,0.96))] py-0 shadow-none">
            <CardHeader className="gap-3">
              <Skeleton className="h-6 w-24 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/6" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full rounded-full bg-white/8" />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

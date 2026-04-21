import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="poster-shell min-h-screen w-full overflow-x-hidden text-[#edf6ef]">
      <main className="relative z-10">
        <section className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#071116_0%,#09181d_42%,#040a0d_100%)]">
          <div
            aria-hidden
            className="atlas-hero-grid absolute inset-0 opacity-70"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_24%_36%,rgba(114,217,228,0.12),transparent_24%),radial-gradient(circle_at_72%_64%,rgba(220,188,110,0.14),transparent_18%),linear-gradient(90deg,rgba(4,12,16,0.94)_0%,rgba(4,12,16,0.76)_38%,rgba(4,12,16,0.42)_64%,rgba(4,12,16,0.9)_100%)]"
          />
          <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-10">
            <div className="w-full">
              <Skeleton className="mb-4 h-4 w-32 bg-[#dcbc6e]/16" />
              <div className="flex gap-3 overflow-hidden pb-2">
                <Skeleton className="h-11 w-44 shrink-0 rounded-full bg-white/10" />
                <Skeleton className="h-11 w-56 shrink-0 rounded-full bg-white/8" />
                <Skeleton className="h-11 w-64 shrink-0 rounded-full bg-white/8" />
              </div>
            </div>

            <div className="flex flex-1 items-center pt-10 sm:pt-12">
              <div className="mx-auto max-w-[20rem] text-center sm:mx-0 sm:max-w-[38rem] sm:text-left">
                <Skeleton className="h-24 w-[18rem] bg-white/8 sm:h-28 sm:w-[26rem]" />
                <div className="mt-5 grid gap-3">
                  <Skeleton className="h-5 w-full max-w-[34rem] bg-white/8" />
                  <Skeleton className="h-5 w-full max-w-[28rem] bg-white/6" />
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <Skeleton className="h-12 w-40 rounded-full bg-white/12" />
                  <Skeleton className="h-12 w-36 rounded-full bg-white/8" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-10">
          <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))] py-0 shadow-none">
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
            <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))] py-0 shadow-none">
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
        </div>
      </main>
    </div>
  );
}

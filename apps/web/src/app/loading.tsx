import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(12,74,110,0.12),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(190,24,93,0.08),_transparent_40%),linear-gradient(135deg,_#0b1020,_#101827_40%,_#0f172a)] text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-14 sm:px-10">
        <section className="grid gap-6">
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-14 w-80 bg-white/10" />
          <Skeleton className="h-6 w-96 bg-white/10" />
        </section>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
          </CardContent>
        </Card>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/10" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full bg-white/10" />
              ))}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <Skeleton className="h-6 w-24 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/10" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full bg-white/10" />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

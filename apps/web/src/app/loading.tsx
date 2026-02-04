import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="app-shell min-h-screen text-slate-900 dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-14 sm:px-10">
        <section className="grid gap-6">
          <Skeleton className="h-6 w-32 bg-slate-200/80 dark:bg-white/10" />
          <Skeleton className="h-14 w-80 bg-slate-200/80 dark:bg-white/10" />
          <Skeleton className="h-6 w-96 bg-slate-200/80 dark:bg-white/10" />
        </section>

        <Card className="border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-slate-200/80 dark:bg-white/10" />
            <Skeleton className="h-4 w-64 bg-slate-200/80 dark:bg-white/10" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full bg-slate-200/80 dark:bg-white/10" />
            <Skeleton className="h-10 w-full bg-slate-200/80 dark:bg-white/10" />
          </CardContent>
        </Card>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Card className="border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-200/80 dark:bg-white/10" />
              <Skeleton className="h-4 w-40 bg-slate-200/80 dark:bg-white/10" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full bg-slate-200/80 dark:bg-white/10" />
              ))}
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <CardHeader>
              <Skeleton className="h-6 w-24 bg-slate-200/80 dark:bg-white/10" />
              <Skeleton className="h-4 w-40 bg-slate-200/80 dark:bg-white/10" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full bg-slate-200/80 dark:bg-white/10" />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

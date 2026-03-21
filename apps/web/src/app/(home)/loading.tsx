import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(61,255,160,0.15)_0%,transparent_35%),linear-gradient(180deg,#0b0d12_0%,#11151e_100%)] text-[#f3f6fd]">
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-3 pb-14 pt-5 sm:px-5 sm:pb-20">
        <section className="grid gap-6">
          <Skeleton className="h-6 w-32 bg-[#1f2633]" />
          <Skeleton className="h-12 w-72 bg-[#151b26] sm:h-14 sm:w-80" />
          <Skeleton className="h-6 w-72 max-w-full bg-[#1f2633] sm:w-96" />
        </section>

        <Card className="gap-0 border-[#222530] bg-[#12161f] py-0 shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-[#1f2633]" />
            <Skeleton className="h-4 w-64 max-w-full bg-[#1a212d]" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full bg-[#151b26]" />
            <Skeleton className="h-10 w-full bg-[#151b26]" />
          </CardContent>
        </Card>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Card className="gap-0 border-[#222530] bg-[#12161f] py-0 shadow-none">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-[#1f2633]" />
              <Skeleton className="h-4 w-40 bg-[#1a212d]" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full bg-[#151b26]" />
              ))}
            </CardContent>
          </Card>
          <Card className="gap-0 border-[#222530] bg-[#12161f] py-0 shadow-none">
            <CardHeader>
              <Skeleton className="h-6 w-24 bg-[#1f2633]" />
              <Skeleton className="h-4 w-40 bg-[#1a212d]" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full bg-[#151b26]" />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

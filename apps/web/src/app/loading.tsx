import { Card, CardContent, CardHeader } from "@footballleagues/ui/card";
import { Skeleton } from "@footballleagues/ui/skeleton";

export default function Loading() {
  return (
    <div className="app-shell min-h-screen text-[#14161b]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-14 sm:px-10">
        <section className="grid gap-6">
          <Skeleton className="h-6 w-32 bg-[#eceef4]" />
          <Skeleton className="h-14 w-80 bg-[#eceef4]" />
          <Skeleton className="h-6 w-96 bg-[#eceef4]" />
        </section>

        <Card className="border-[#d9dce4] bg-white/80">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-[#eceef4]" />
            <Skeleton className="h-4 w-64 bg-[#eceef4]" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full bg-[#eceef4]" />
            <Skeleton className="h-10 w-full bg-[#eceef4]" />
          </CardContent>
        </Card>

        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Card className="border-[#d9dce4] bg-white/80">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-[#eceef4]" />
              <Skeleton className="h-4 w-40 bg-[#eceef4]" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full bg-[#eceef4]" />
              ))}
            </CardContent>
          </Card>
          <Card className="border-[#d9dce4] bg-white/80">
            <CardHeader>
              <Skeleton className="h-6 w-24 bg-[#eceef4]" />
              <Skeleton className="h-4 w-40 bg-[#eceef4]" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full bg-[#eceef4]" />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

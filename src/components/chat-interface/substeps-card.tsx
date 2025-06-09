import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ListOrdered } from "lucide-react";

export function SubstepsCard({
  substeps,
}: {
  substeps: { action: string; params: string; raw?: string }[];
}) {
  console.log(substeps, "?>?>?>?>1234");
  if (!substeps?.length) return null;
  return (
    <Card className="mb-2 border-blue-200 bg-blue-50/60">
      <CardHeader className="flex flex-row items-center gap-2 py-2 px-4">
        <ListOrdered className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-blue-700 text-sm">Substeps</span>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-1">
        <ol className="list-decimal ml-5 text-sm text-blue-900 space-y-1">
          {substeps.map((step, idx) => (
            <li key={idx}>
              <span className="font-semibold">{step.action}:</span>{" "}
              <span>{step.params}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

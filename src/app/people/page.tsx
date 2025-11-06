import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PeoplePage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          <p>People list will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}


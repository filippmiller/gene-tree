import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Hello, Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome to your genealogy tree dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}


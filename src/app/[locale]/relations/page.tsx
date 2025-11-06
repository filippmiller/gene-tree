import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelationsPage() {
  const t = useTranslations("relations");

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("listPlaceholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}


import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppPage() {
  const t = useTranslations("app");

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("helloTree")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("welcome")}</p>
        </CardContent>
      </Card>
    </div>
  );
}


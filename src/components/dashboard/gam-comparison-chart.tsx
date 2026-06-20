"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

export function GamComparisonChart({
  data,
}: {
  data: { name: string; collected: number; total: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>التحصيل مقابل المستهدف لكل جمعية</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">لا توجد بيانات كافية بعد</p>
        ) : (
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    direction: "rtl",
                    fontFamily: "var(--font-body)",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                  }}
                />
                <Bar dataKey="total" fill="var(--muted)" radius={[6, 6, 0, 0]} name="المستهدف" />
                <Bar dataKey="collected" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="المحصّل" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

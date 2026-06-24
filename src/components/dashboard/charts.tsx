"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const tooltipStyle = {
  contentStyle: {
    background: "rgba(7, 26, 53, 0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "#8aa0c2" },
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-xs text-muted">
      {message}
    </div>
  );
}

export function TransferChart({ data }: { data: { month: string; sent: number; saved: number }[] }) {
  return (
    <Card className="h-[280px]">
      <CardHeader>
        <CardTitle>Monthly transfers & savings</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        {data.length === 0 ? (
          <EmptyChart message="No transfers yet — send money to see your monthly activity." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8aa0c2", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8aa0c2", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sent" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              <Bar dataKey="saved" fill="#00D4FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AllocationChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <Card className="h-[280px]">
      <CardHeader>
        <CardTitle>Money allocation</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[200px] items-center gap-4">
        {data.length === 0 ? (
          <EmptyChart message="No activity yet to allocate." />
        ) : (
          <>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {data.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-xs">
              {data.map((e) => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: e.color }} />
                  <span className="text-muted">{e.name}</span>
                  <span className="ml-auto font-medium">{e.value}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function RateChart({ data }: { data: { t: string; rate: number }[] }) {
  return (
    <Card className="h-[280px]">
      <CardHeader>
        <CardTitle>USD/ZMW today</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        {data.length === 0 ? (
          <EmptyChart message="Rate history unavailable." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fill: "#8aa0c2", fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#8aa0c2", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="rate" stroke="#00D4FF" fill="url(#rateGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SavingsSparkline({ data }: { data: { v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

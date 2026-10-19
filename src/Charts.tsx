import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { colors, sports } from "./domain";
const tooltip = {
  contentStyle: {
    background: "#171D20",
    border: "1px solid #293237",
    borderRadius: 10,
    fontSize: 12,
    color: "#F3F5EF",
  },
  labelStyle: { color: "#9BA8AD" },
  itemStyle: { color: "#F3F5EF" },
};
export function VolumeChart({
  data,
  compact = false,
}: {
  data: Record<string, number | string>[];
  compact?: boolean;
}) {
  return (
    <div
      className={`chart ${compact ? "short" : ""}`}
      role="img"
      aria-label="Weekly training hours by discipline"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={compact ? 19 : 26}
          margin={{ top: 10, right: 0, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            stroke="#263034"
            vertical={false}
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8b999e", fontSize: 10 }}
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8b999e", fontSize: 10 }}
            unit="h"
          />
          <Tooltip {...tooltip} cursor={{ fill: "#ffffff05" }} />
          {sports.map((sp) => (
            <Bar
              key={sp}
              dataKey={sp}
              stackId="a"
              fill={colors[sp]}
              radius={sp === "Strength" ? [3, 3, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div
      className="donut-chart"
      role="img"
      aria-label={data
        .map((d) => `${d.name} ${Math.round(d.value)} minutes`)
        .join(", ")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="69%"
            outerRadius="90%"
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={colors[d.name as keyof typeof colors]} />
            ))}
          </Pie>
          <Tooltip
            {...tooltip}
            formatter={(v) => `${Math.round(Number(v))} min`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
export function TrendChart({
  data,
  keys,
  color = "#D6FF43",
  unit = "",
}: {
  data: Record<string, number | string>[];
  keys: string[];
  color?: string;
  unit?: string;
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`${keys.join(" and ")} trends in ${unit}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -15, right: 15, top: 10 }}>
          <CartesianGrid
            stroke="#263034"
            vertical={false}
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9BA8AD", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#9BA8AD", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit={unit}
          />
          <Tooltip {...tooltip} />
          <Legend />
          {keys.map((k, i) => (
            <Line
              type="monotone"
              key={k}
              dataKey={k}
              stroke={i === 0 ? color : "#9BA8AD"}
              strokeWidth={2}
              dot={data.length < 12}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Spark({
  values,
  color = "#D6FF43",
}: {
  values: number[];
  color?: string;
}) {
  return (
    <div className="spark" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={values.map((v) => ({ v }))}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={color}
            fillOpacity={0.05}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

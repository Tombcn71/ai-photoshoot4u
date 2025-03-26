"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function UsageChart() {
  // Sample data for the chart
  const data = [
    { name: "Week 1", credits: 5 },
    { name: "Week 2", credits: 8 },
    { name: "Week 3", credits: 3 },
    { name: "Week 4", credits: 12 },
    { name: "Week 5", credits: 2 },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="credits" name="Credits Used" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}


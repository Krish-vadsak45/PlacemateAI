"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';

interface PlacementItemData {
  _id: string;
  companyName: string;
  jobRole: string;
  package?: string;
  matchScore?: number;
  matchBreakdown?: {
    skillsMatch: number;
    cgpaMatch: number;
    branchMatch: number;
    experienceMatch: number;
    locationMatch: number;
    overallScore: number;
  };
}

interface PlacementComparisonChartsProps {
  placements: PlacementItemData[];
}

export default function PlacementComparisonCharts({
  placements,
}: PlacementComparisonChartsProps) {
  // Parse numeric CTC (e.g. "12 LPA", "₹18.5 LPA", "25000/mo") for bar chart
  const parseCtcNumeric = (packageStr?: string): number => {
    if (!packageStr) return 0;
    const cleanStr = packageStr.toLowerCase().replace(/,/g, '');
    const lpaMatch = cleanStr.match(/(\d+(\.\d+)?)\s*(lpa|lakh|l)/);
    if (lpaMatch) return parseFloat(lpaMatch[1]);
    const numberMatch = cleanStr.match(/(\d+(\.\d+)?)/);
    if (numberMatch) {
      const val = parseFloat(numberMatch[1]);
      if (val > 1000) return +(val / 100000).toFixed(2); // Convert raw INR to LPA if >1000
      return val;
    }
    return 0;
  };

  const packageData = placements.map((p) => ({
    company: p.companyName,
    packageLPA: parseCtcNumeric(p.package),
    rawPackage: p.package || 'N/A',
  }));

  // Build Radar Data comparing eligibility & match criteria across categories
  const categories = [
    { key: 'skillsMatch', name: 'Skills Fit' },
    { key: 'cgpaMatch', name: 'CGPA Fit' },
    { key: 'branchMatch', name: 'Branch Fit' },
    { key: 'experienceMatch', name: 'Experience' },
    { key: 'locationMatch', name: 'Location' },
  ];

  const radarData = categories.map((cat) => {
    const entry: Record<string, any> = { category: cat.name };
    placements.forEach((p) => {
      const breakdown = p.matchBreakdown;
      entry[p.companyName] = breakdown
        ? (breakdown as any)[cat.key] || p.matchScore || 50
        : p.matchScore || 60;
    });
    return entry;
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
      {/* Chart 1: Package Comparison */}
      <div className="glass-panel p-5 rounded-2xl border border-border bg-card">
        <h3 className="text-sm font-bold text-foreground mb-1">
          Package Comparison (LPA)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Visualizing CTC compensation packages side-by-side
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={packageData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="company"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-muted-foreground"
                unit=" L"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-xl border border-border text-xs shadow-lg bg-background">
                        <p className="font-bold text-foreground">{data.company}</p>
                        <p className="text-primary font-semibold mt-1">
                          CTC: {data.rawPackage}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="packageLPA" radius={[8, 8, 0, 0]}>
                {packageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Skill & Match Score Breakdown */}
      <div className="glass-panel p-5 rounded-2xl border border-border bg-card">
        <h3 className="text-sm font-bold text-foreground mb-1">
          Profile Match Alignment
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Comparing skills, CGPA & location fit %
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="currentColor" className="text-border" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {placements.map((p, idx) => (
                <Radar
                  key={p._id}
                  name={p.companyName}
                  dataKey={p.companyName}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.25}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

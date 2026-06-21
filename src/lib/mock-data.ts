export const statsAdmin = [
  { label: "Total Dataset", value: "1,284", delta: "+24 this week" },
  { label: "Total Analysis", value: "892", delta: "+12 today" },
  { label: "Total Students", value: "147", delta: "+3 this month" },
  { label: "Total Clusters", value: "8", delta: "stable" },
];

export const clusterDistribution = [
  { name: "Apple", value: 312 },
  { name: "Orange", value: 248 },
  { name: "Banana", value: 196 },
  { name: "Mango", value: 142 },
  { name: "Grape", value: 98 },
  { name: "Noise", value: 22 },
];

export const analysisHistory = [
  { day: "Mon", runs: 32 },
  { day: "Tue", runs: 48 },
  { day: "Wed", runs: 41 },
  { day: "Thu", runs: 67 },
  { day: "Fri", runs: 58 },
  { day: "Sat", runs: 24 },
  { day: "Sun", runs: 19 },
];

export const datasetRows = Array.from({ length: 12 }).map((_, i) => ({
  id: `IMG-${1000 + i}`,
  name: ["apple_red_01.jpg", "orange_02.jpg", "banana_ripe.jpg", "mango_green.jpg", "grape_purple.jpg"][i % 5],
  fruit: ["Apple", "Orange", "Banana", "Mango", "Grape"][i % 5],
  size: `${(120 + i * 13) % 400 + 50} KB`,
  uploaded: `2025-05-${(10 + i).toString().padStart(2, "0")}`,
  cluster: `C-${(i % 6) + 1}`,
}));

export const students = Array.from({ length: 8 }).map((_, i) => ({
  id: `STU-${2400 + i}`,
  name: ["Ayu Lestari", "Budi Santoso", "Citra Dewi", "Dimas Aji", "Eka Putri", "Farhan R.", "Gita Wulandari", "Hadi Pratama"][i],
  email: `student${i + 1}@univ.edu`,
  institution: "State University",
  joined: `2025-0${(i % 9) + 1}-15`,
  status: i % 4 === 0 ? "Inactive" : "Active",
}));

export const clusters = [
  { id: "C-1", label: "Apple — Red Ripe", count: 312, dominantColor: "#C0392B", shape: "Round" },
  { id: "C-2", label: "Orange — Mature", count: 248, dominantColor: "#E67E22", shape: "Round" },
  { id: "C-3", label: "Banana — Yellow", count: 196, dominantColor: "#F4D03F", shape: "Curved" },
  { id: "C-4", label: "Mango — Green Yellow", count: 142, dominantColor: "#7DCE82", shape: "Oval" },
  { id: "C-5", label: "Grape — Purple", count: 98, dominantColor: "#6C3483", shape: "Cluster" },
  { id: "C-6", label: "Noise", count: 22, dominantColor: "#9CA3AF", shape: "Mixed" },
];

export const scatterData = Array.from({ length: 120 }).map((_, i) => {
  const cluster = i % 6;
  const centers = [
    [25, 70], [55, 60], [75, 80], [40, 35], [80, 30], [50, 50],
  ];
  const [cx, cy] = centers[cluster];
  return {
    x: cx + (Math.random() - 0.5) * 14,
    y: cy + (Math.random() - 0.5) * 14,
    cluster: cluster === 5 ? -1 : cluster,
  };
});

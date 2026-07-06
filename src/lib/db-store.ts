import { createServerFn } from "@tanstack/react-start";
import { runDBSCAN, normalizeFeatures, buildWeights, assignNearestCluster, DBSCANInputPoint } from "./dbscan";

// Interfaces
export interface FruitItem {
  id: string;
  name: string; // filename
  fruit: string; // classification (e.g. Apple, Orange, Banana, Mango, Grape, Noise)
  size: string;
  uploaded: string;
  hue: number;         // 0 - 360
  saturation: number;  // 0 - 1
  value: number;       // 0 - 1
  circularity: number; // 0 - 1
  aspectRatio: number; // 0.5 - 3.0
  x: number;           // 0 - 100 for scatter plot
  y: number;           // 0 - 100 for scatter plot
  isSynthetic: boolean;
  imageUrl?: string;   // base64 data URL
  clusterId?: number;  // DBSCAN cluster ID (-1, 0, 1, 2...)
  isCore?: boolean;
  isBorder?: boolean;
  isNoise?: boolean;
  cluster?: string;
  clusterLabel?: string;
}

export interface ClusterConfig {
  id: string; // e.g. "C-1", "C-2"...
  label: string; // e.g. "Apple — Red Ripe"
  dominantColor: string; // hex color
  shape: string; // e.g. "Round", "Oval"
  dbscanClusterId?: number; // mapped DBSCAN cluster ID
}

interface DbSchema {
  items: FruitItem[];
  clusterConfigs: ClusterConfig[];
  dbscanSettings?: {
    eps: number;
    minSamples: number;
    featureMode: "color" | "shape" | "both";
  };
  users?: any[];
}

let memoryDb: DbSchema | null = null;

// Pre-populate data helper
function prePopulateDb(): DbSchema {
  const configs: ClusterConfig[] = [
    { id: "C-1", label: "Apple — Red Ripe", dominantColor: "#C0392B", shape: "Round" },
    { id: "C-2", label: "Orange — Mature", dominantColor: "#E67E22", shape: "Round" },
    { id: "C-3", label: "Banana — Yellow", dominantColor: "#F4D03F", shape: "Curved" },
    { id: "C-4", label: "Mango — Green Yellow", dominantColor: "#7DCE82", shape: "Oval" },
    { id: "C-5", label: "Grape — Purple", dominantColor: "#6C3483", shape: "Cluster" },
    { id: "C-6", label: "Noise", dominantColor: "#9CA3AF", shape: "Mixed" },
  ];

  const items: FruitItem[] = [];

  // Generate 12 detailed mock entries matching datasetRows in mock-data.ts
  const fruitsList = ["Apel", "Jeruk", "Pisang", "Mangga", "Anggur"];
  const fileNames = ["apel_merah_01.jpg", "jeruk_02.jpg", "pisang_matang.jpg", "mangga_hijau.jpg", "anggur_ungu.jpg"];
  const clusterMapping = ["C-1", "C-2", "C-3", "C-4", "C-5"];

  // Default features for each fruit type (hue in degrees HSV)
  const baseFeatures: Record<string, { h: number, s: number, v: number, c: number, a: number, x: number, y: number }> = {
    "Apel":   { h: 12,  s: 0.80, v: 0.75, c: 0.92, a: 1.02, x: 25, y: 70 },
    "Jeruk":  { h: 28,  s: 0.85, v: 0.80, c: 0.88, a: 0.98, x: 55, y: 60 },
    "Pisang": { h: 52,  s: 0.90, v: 0.88, c: 0.42, a: 2.40, x: 75, y: 80 },
    "Mangga": { h: 42,  s: 0.72, v: 0.76, c: 0.76, a: 1.34, x: 40, y: 35 },
    "Anggur": { h: 282, s: 0.62, v: 0.42, c: 0.88, a: 0.92, x: 80, y: 30 },
  };

  for (let i = 0; i < 12; i++) {
    const fruit = fruitsList[i % 5];
    const name = fileNames[i % 5];
    const base = baseFeatures[fruit];
    const seed = i * 0.05;
    
    items.push({
      id: `IMG-${1000 + i}`,
      name,
      fruit,
      size: `${(120 + i * 13) % 400 + 50} KB`,
      uploaded: `2025-05-${(10 + i).toString().padStart(2, "0")}`,
      // Add slight variance to features
      hue: Math.round((base.h + (Math.random() - 0.5) * 15 + 360) % 360),
      saturation: parseFloat(Math.min(1, Math.max(0, base.s + (Math.random() - 0.5) * 0.15)).toFixed(4)),
      value: parseFloat(Math.min(1, Math.max(0, base.v + (Math.random() - 0.5) * 0.15)).toFixed(4)),
      circularity: parseFloat(Math.min(1, Math.max(0.1, base.c + (Math.random() - 0.5) * 0.1)).toFixed(4)),
      aspectRatio: parseFloat(Math.max(0.4, base.a + (Math.random() - 0.5) * 0.4).toFixed(4)),
      x: parseFloat((base.x + (Math.random() - 0.5) * 6).toFixed(1)),
      y: parseFloat((base.y + (Math.random() - 0.5) * 6).toFixed(1)),
      isSynthetic: false,
    });
  }

  // Generate 120 synthetic scatter data points
  // centers align with clusters in mock-data.ts
  const centers = [
    [25, 70], [55, 60], [75, 80], [40, 35], [80, 30], [50, 50],
  ];
  const clusterFruitNames = ["Apel", "Jeruk", "Pisang", "Mangga", "Anggur", "Noise"];

  for (let i = 0; i < 120; i++) {
    const clusterIdx = i % 6;
    const [cx, cy] = centers[clusterIdx];
    const fruit = clusterFruitNames[clusterIdx];
    
    // Add random offset
    const x = cx + (Math.random() - 0.5) * 14;
    const y = cy + (Math.random() - 0.5) * 14;

    // Generate features linked to their cluster
    let hue = 0, sat = 0, val = 0, circ = 0, aspect = 0;
    if (clusterIdx < 5) {
      const base = baseFeatures[clusterFruitNames[clusterIdx]];
      hue = Math.round((base.h + (Math.random() - 0.5) * 15 + 360) % 360);
      sat = Math.min(1, Math.max(0, base.s + (Math.random() - 0.5) * 0.15));
      val = Math.min(1, Math.max(0, base.v + (Math.random() - 0.5) * 0.15));
      circ = Math.min(1, Math.max(0, base.c + (Math.random() - 0.5) * 0.1));
      aspect = Math.max(0.4, base.a + (Math.random() - 0.5) * 0.4);
    } else {
      // Noise
      hue = Math.round(Math.random() * 360);
      sat = Math.random();
      val = Math.random();
      circ = Math.random();
      aspect = Math.random() * 2.5 + 0.5;
    }

    items.push({
      id: `PT-${100 + i}`,
      name: `scatter_point_${i}.png`,
      fruit,
      size: "4 KB",
      uploaded: "2025-05-01",
      hue,
      saturation: parseFloat(sat.toFixed(2)),
      value: parseFloat(val.toFixed(2)),
      circularity: parseFloat(circ.toFixed(2)),
      aspectRatio: parseFloat(aspect.toFixed(2)),
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
      isSynthetic: true,
    });
  }

  const DEFAULT_USERS = [
    {
      fullName: "Jane Doe",
      username: "janedoe",
      email: "jane@universitas.ac.id",
      institution: "Universitas Negeri",
      phone: "+62 812 3456 7891",
      role: "admin",
      avatar: "",
      passwordHash: "admin123",
    },
    {
      fullName: "Siswa Perdana",
      username: "siswaperdana",
      email: "siswa@universitas.ac.id",
      institution: "Universitas Negeri",
      phone: "+62 812 9876 5432",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2408",
      joined: "2025-09-01",
      status: "Active",
    },
    {
      fullName: "Ayu Lestari",
      username: "ayulestari",
      email: "student1@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2400",
      joined: "2025-01-15",
      status: "Inactive",
    },
    {
      fullName: "Budi Santoso",
      username: "budisantoso",
      email: "student2@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2401",
      joined: "2025-02-15",
      status: "Active",
    },
    {
      fullName: "Citra Dewi",
      username: "citradewi",
      email: "student3@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2402",
      joined: "2025-03-15",
      status: "Active",
    },
    {
      fullName: "Dimas Aji",
      username: "dimasaji",
      email: "student4@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2403",
      joined: "2025-04-15",
      status: "Active",
    },
    {
      fullName: "Eka Putri",
      username: "ekaputri",
      email: "student5@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2404",
      joined: "2025-05-15",
      status: "Inactive",
    },
    {
      fullName: "Farhan R.",
      username: "farhanr",
      email: "student6@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2405",
      joined: "2025-06-15",
      status: "Active",
    },
    {
      fullName: "Gita Wulandari",
      username: "gitawulandari",
      email: "student7@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2406",
      joined: "2025-07-15",
      status: "Active",
    },
    {
      fullName: "Hadi Pratama",
      username: "hadipratama",
      email: "student8@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2407",
      joined: "2025-08-15",
      status: "Active",
    },
  ];

  return {
    items,
    clusterConfigs: configs,
    dbscanSettings: { eps: 0.35, minSamples: 3, featureMode: "both" },
    users: DEFAULT_USERS
  };
}

// IO Helpers
async function getDbPath() {
  const path = await import("path");
  return path.resolve(process.cwd(), "src/lib/db.json");
}

async function loadDb(): Promise<DbSchema> {
  if (typeof window !== "undefined") {
    throw new Error("Cannot load DB on the client");
  }

  const DEFAULT_USERS = [
    {
      fullName: "Jane Doe",
      username: "janedoe",
      email: "jane@universitas.ac.id",
      institution: "Universitas Negeri",
      phone: "+62 812 3456 7891",
      role: "admin",
      avatar: "",
      passwordHash: "admin123",
    },
    {
      fullName: "Siswa Perdana",
      username: "siswaperdana",
      email: "siswa@universitas.ac.id",
      institution: "Universitas Negeri",
      phone: "+62 812 9876 5432",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2408",
      joined: "2025-09-01",
      status: "Active",
    },
    {
      fullName: "Ayu Lestari",
      username: "ayulestari",
      email: "student1@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2400",
      joined: "2025-01-15",
      status: "Inactive",
    },
    {
      fullName: "Budi Santoso",
      username: "budisantoso",
      email: "student2@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2401",
      joined: "2025-02-15",
      status: "Active",
    },
    {
      fullName: "Citra Dewi",
      username: "citradewi",
      email: "student3@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2402",
      joined: "2025-03-15",
      status: "Active",
    },
    {
      fullName: "Dimas Aji",
      username: "dimasaji",
      email: "student4@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2403",
      joined: "2025-04-15",
      status: "Active",
    },
    {
      fullName: "Eka Putri",
      username: "ekaputri",
      email: "student5@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2404",
      joined: "2025-05-15",
      status: "Inactive",
    },
    {
      fullName: "Farhan R.",
      username: "farhanr",
      email: "student6@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2405",
      joined: "2025-06-15",
      status: "Active",
    },
    {
      fullName: "Gita Wulandari",
      username: "gitawulandari",
      email: "student7@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2406",
      joined: "2025-07-15",
      status: "Active",
    },
    {
      fullName: "Hadi Pratama",
      username: "hadipratama",
      email: "student8@univ.edu",
      institution: "State University",
      phone: "",
      role: "student",
      avatar: "",
      passwordHash: "student123",
      id: "STU-2407",
      joined: "2025-08-15",
      status: "Active",
    },
  ];

  try {
    const fs = await import("fs/promises");
    const dbPath = await getDbPath();
    const data = await fs.readFile(dbPath, "utf-8");
    memoryDb = JSON.parse(data);
    
    // Add users if missing from server db
    if (!memoryDb!.users) {
      memoryDb!.users = DEFAULT_USERS;
      await saveDb(memoryDb!);
    }
    
    return memoryDb!;
  } catch (error) {
    if (memoryDb) return memoryDb;
    memoryDb = prePopulateDb();
    await saveDb(memoryDb).catch(() => {
      console.warn("Failed to write db.json, running in-memory");
    });
    return memoryDb;
  }
}

async function saveDb(data: DbSchema) {
  if (typeof window !== "undefined") return;
  memoryDb = data;
  try {
    const fs = await import("fs/promises");
    const dbPath = await getDbPath();
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    // In-memory fallback
  }
}

// Server Functions

export const getDataset = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();
    // Return only non-synthetic items for the dataset list
    return db.items.filter(item => !item.isSynthetic);
  });

export const getClusters = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();
    return db.clusterConfigs;
  });

export const addDatasetItem = createServerFn({ method: "POST" })
  .handler(async ({ data }: any) => {
    const db = await loadDb();
    
    // Generate a new ID
    const nextId = "IMG-" + (1000 + db.items.filter(i => !i.isSynthetic).length);
    
    const newItem: FruitItem = {
      ...data,
      id: nextId,
      uploaded: new Date().toISOString().split("T")[0],
      isSynthetic: false,
    };
    
    db.items.push(newItem);
    await saveDb(db);
    return newItem;
  });

export const deleteDatasetItem = createServerFn({ method: "POST" })
  .handler(async ({ data: id }: any) => {
    const db = await loadDb();
    db.items = db.items.filter(i => i.id !== id);
    await saveDb(db);
    return { success: true };
  });

export const updateDatasetItem = createServerFn({ method: "POST" })
  .handler(async ({ data }: any) => {
    const db = await loadDb();
    db.items = db.items.map(i => i.id === data.id ? { ...i, ...data } : i);
    await saveDb(db);
    return { success: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();
    
    const totalDataset = db.items.filter(i => !i.isSynthetic).length;
    const totalAnalysis = db.items.length; // total points in system
    
    const settings = db.dbscanSettings || { eps: 0.35, minSamples: 3, featureMode: "both" };
    const weights = buildWeights(settings.featureMode);

    // Run a default DBSCAN to estimate clusters
    const dbscanInputs: DBSCANInputPoint[] = db.items.map(item => ({
      id: item.id,
      features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio]
    }));
    const normalized = normalizeFeatures(dbscanInputs);
    const clusterResults = runDBSCAN(normalized, settings.eps, settings.minSamples, weights);
    
    const uniqueClusters = new Set(
      Array.from(clusterResults.values())
        .map(v => v.clusterId)
        .filter(cid => cid !== -1)
    );

    const noiseCount = Array.from(clusterResults.values()).filter(v => v.clusterId === -1).length;

    // Distribute among the configs for stats
    const distribution = db.clusterConfigs.map(c => {
      // Find items that match this cluster type
      let count = 0;
      if (c.id === "C-6") {
        count = noiseCount;
      } else {
        const fruitName = c.label.split(" — ")[0];
        count = db.items.filter(i => i.fruit === fruitName).length;
      }
      return {
        name: c.label.split(" — ")[0],
        value: count,
      };
    });

    return {
      stats: [
        { label: "Total Dataset", value: totalDataset.toString(), delta: "+2 this week" },
        { label: "Total Analysis Runs", value: totalAnalysis.toString(), delta: "+15 today" },
        { label: "Total Clusters", value: uniqueClusters.size.toString(), delta: "stable" },
        { label: "Noise Points", value: noiseCount.toString(), delta: `${noiseCount} isolated` }
      ] as Array<{ label: string; value: string; delta: string }>,
      distribution,
      history: [
        { day: "Mon", runs: Math.round(totalAnalysis * 0.12) },
        { day: "Tue", runs: Math.round(totalAnalysis * 0.15) },
        { day: "Wed", runs: Math.round(totalAnalysis * 0.14) },
        { day: "Thu", runs: Math.round(totalAnalysis * 0.18) },
        { day: "Fri", runs: Math.round(totalAnalysis * 0.16) },
        { day: "Sat", runs: Math.round(totalAnalysis * 0.10) },
        { day: "Sun", runs: Math.round(totalAnalysis * 0.15) },
      ]
    };
  });

export const getStudentDashboard = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();

    // Only real (non-synthetic) items represent actual student uploads
    const realItems = db.items.filter(i => !i.isSynthetic);
    const totalAnalysis = realItems.length;

    // Count items uploaded this week (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = realItems.filter(i => {
      if (!i.uploaded) return false;
      return new Date(i.uploaded) >= oneWeekAgo;
    }).length;

    // Sort items newest first
    const sortedItems = [...realItems].sort((a, b) => {
      const da = new Date(a.uploaded || "1970-01-01").getTime();
      const db2 = new Date(b.uploaded || "1970-01-01").getTime();
      return db2 - da;
    });

    const latestItem = sortedItems[0] || null;

    // Build a human-readable cluster label from clusterConfigs
    const getClusterLabel = (fruitName: string): string => {
      const config = db.clusterConfigs.find(c =>
        c.label.toLowerCase().includes(fruitName.toLowerCase())
      );
      if (config) return `${config.label.split(" — ")[0]} — ${config.id}`;
      return fruitName;
    };

    const latestResult = latestItem ? getClusterLabel(latestItem.fruit) : "Belum ada";
    const latestUploaded = latestItem ? latestItem.uploaded : "";

    // 5 most-recent items for "Lanjutkan pekerjaan" list
    const recentItems = sortedItems.slice(0, 5).map(item => ({
      id: item.id,
      name: item.name,
      fruit: item.fruit,
      uploaded: item.uploaded,
      clusterLabel: getClusterLabel(item.fruit),
    }));

    // Fruit frequency distribution (top 6)
    const counts: Record<string, number> = {};
    realItems.forEach(i => { counts[i.fruit] = (counts[i.fruit] || 0) + 1; });
    const fruitDistribution = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return {
      totalAnalysis,
      totalImages: totalAnalysis,
      thisWeekCount,
      latestResult,
      latestUploaded,
      recentItems,
      fruitDistribution,
    };
  });

export const updateClusterConfigs = createServerFn({ method: "POST" })
  .handler(async ({ data: configs }: any) => {
    const db = await loadDb();
    db.clusterConfigs = configs;
    await saveDb(db);
    return configs;
  });
export const updateClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data: config }: any) => {
    const db = await loadDb();
    db.clusterConfigs = db.clusterConfigs.map(c => c.id === config.id ? config : c);
    await saveDb(db);
    return db.clusterConfigs;
  });
export const addClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data }: any) => {
    const db = await loadDb();
    const nextId = `C-${db.clusterConfigs.length + 1}`;
    const newConfig = { ...data, id: nextId };
    db.clusterConfigs.push(newConfig);
    await saveDb(db);
    return newConfig;
  });
export const runDBSCANClustering = createServerFn({ method: "POST" })
  .handler(async ({ data: { eps, minSamples, featureMode, tempPoint, tempPoints } }: any) => {
    const db = await loadDb();
    
    // Build weights for expanded feature space [sinH, cosH, sat, val, circ, ar]
    const weights = buildWeights(featureMode);

    const items = [...db.items];
    
    if (tempPoints && tempPoints.length > 0) {
      tempPoints.forEach((tp: any, idx: number) => {
        items.push({
          id: tp.id || `TEMP-RUN-${idx}`,
          name: tp.name || `current_run_${idx + 1}.jpg`,
          fruit: tp.fruit || "Unknown",
          size: "0 KB",
          uploaded: new Date().toISOString().split("T")[0],
          hue: tp.hue,
          saturation: tp.saturation,
          value: tp.value,
          circularity: tp.circularity,
          aspectRatio: tp.aspectRatio,
          // Project to 2D for the scatter plot
          x: parseFloat((tp.circularity * 100).toFixed(1)),
          y: parseFloat((tp.hue / 3.6).toFixed(1)),
          isSynthetic: false,
          imageUrl: tp.imageUrl,
        });
      });
    } else if (tempPoint) {
      const tempPointId = "TEMP-RUN";
      items.push({
        id: tempPointId,
        name: "current_run.jpg",
        fruit: tempPoint.fruit || "Unknown",
        size: "0 KB",
        uploaded: new Date().toISOString().split("T")[0],
        hue: tempPoint.hue,
        saturation: tempPoint.saturation,
        value: tempPoint.value,
        circularity: tempPoint.circularity,
        aspectRatio: tempPoint.aspectRatio,
        // Project to 2D for the scatter plot
        x: parseFloat((tempPoint.circularity * 100).toFixed(1)),
        y: parseFloat((tempPoint.hue / 3.6).toFixed(1)),
        isSynthetic: false,
      });
    }

    // Convert items into DBSCANInputPoints
    const dbscanInputs: DBSCANInputPoint[] = items.map(item => ({
      id: item.id,
      features: [
        item.hue,
        item.saturation,
        item.value,
        item.circularity,
        item.aspectRatio
      ],
      item
    }));

    // Normalize
    const normalized = normalizeFeatures(dbscanInputs);

    // Run DBSCAN using Python script, fallback to TS if it fails
    let clusterResults: Map<string, any>;
    try {
      const path = await import("path");
      const { execSync } = await import("child_process");
      const scriptPath = path.resolve("src/lib/dbscan.py");
      const payload = JSON.stringify({
        points: dbscanInputs,
        eps: eps,
        minSamples: minSamples,
        weights: weights,
      });

      const output = execSync(`py -3 "${scriptPath}"`, {
        input: payload,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      const parsed = JSON.parse(output);
      clusterResults = new Map(Object.entries(parsed));
    } catch (err) {
      console.warn("Python DBSCAN failed, falling back to TypeScript implementation:", err);
      clusterResults = runDBSCAN(normalized, eps, minSamples, weights);
    }

    // Apply nearest-neighbor fallback: TEMP points that are still noise
    // adopt the cluster of their closest non-noise neighbor so the result
    // always shows a real fruit label instead of "Derau".
    const tempIdList: string[] = [
      ...(tempPoints ? tempPoints.map((tp: any, i: number) => (tp.id as string) || `TEMP-RUN-${i}`) : []),
      ...(tempPoint ? ["TEMP-RUN"] : []),
    ];
    const tempIds = new Set<string>(tempIdList);

    for (const tid of tempIds) {
      const r = clusterResults.get(tid);
      if (r && r.clusterId === -1) {
        const fallback = assignNearestCluster(tid, normalized, clusterResults, weights);
        clusterResults.set(tid, fallback);
      }
    }

    // Collect result points
    const resultPoints = items.map(item => {
      const dbscanRes = clusterResults.get(item.id);
      return {
        ...item,
        clusterId: dbscanRes ? dbscanRes.clusterId : -1,
        isCore: dbscanRes ? dbscanRes.isCore : false,
        isBorder: dbscanRes ? dbscanRes.isBorder : false,
        isNoise: dbscanRes ? dbscanRes.isNoise : true,
      };
    });

    // Map the arbitrary DBSCAN cluster IDs to clusterConfigs based on majority vote
    // Count dominant fruit type in each cluster
    const clusterFruitMapping = new Map<number, string>();
    const uniqueClusterIds = Array.from(new Set(resultPoints.map(p => p.clusterId))).filter(id => id !== -1);

    for (const cid of uniqueClusterIds) {
      const clusterPoints = resultPoints.filter(p => p.clusterId === cid);
      
      // Count fruit label frequency
      const counts: Record<string, number> = {};
      for (const p of clusterPoints) {
        const fruit = p.fruit || "Unknown";
        counts[fruit] = (counts[fruit] || 0) + 1;
      }

      // Find dominant fruit
      let dominantFruit = "Unknown";
      let maxCount = -1;
      for (const [fruit, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantFruit = fruit;
        }
      }
      clusterFruitMapping.set(cid, dominantFruit);
    }

    // Update point fruit names or cluster label mappings
    const clusterConfigs = [...db.clusterConfigs];
    
    // Assign cluster label names matching clusterConfigs
    const processedPoints = resultPoints.map(pt => {
      let clusterLabel = "Derau (Noise)";
      let clusterIdStr = "C-7";

      const noiseConfig = clusterConfigs.find(c => c.label.includes("Derau") || c.label.includes("Noise"));
      if (noiseConfig) {
        clusterLabel = noiseConfig.label;
        clusterIdStr = noiseConfig.id;
      }

      if (pt.clusterId !== -1) {
        const mappedFruit = clusterFruitMapping.get(pt.clusterId!);
        const config = clusterConfigs.find(c =>
          mappedFruit && c.label.toLowerCase().includes(mappedFruit.toLowerCase())
        );
        if (config) {
          clusterLabel = config.label;
          clusterIdStr = config.id;
        } else {
          clusterLabel = `Cluster ${pt.clusterId! + 1}`;
          clusterIdStr = `C-${pt.clusterId! + 1}`;
        }
      }

      return {
        ...pt,
        cluster: clusterIdStr,
        clusterLabel,
      };
    });

    // ── Prototype-based classification for TEMP (uploaded) points ──────────
    // The majority-vote cluster label can fail when DB items have mixed/unknown
    // fruit names. For uploaded images we directly classify by nearest prototype.
    const PROTOTYPES = [
      { fruit: "Apel",     configKey: "apel",     hue: 12,  sat: 0.80, val: 0.75, circ: 0.92, ar: 1.02 },
      { fruit: "Jeruk",    configKey: "jeruk",    hue: 28,  sat: 0.85, val: 0.85, circ: 0.88, ar: 0.98 },
      { fruit: "Pisang",   configKey: "pisang",   hue: 52,  sat: 0.90, val: 0.88, circ: 0.42, ar: 2.40 },
      { fruit: "Mangga",   configKey: "mangga",   hue: 42,  sat: 0.72, val: 0.76, circ: 0.76, ar: 1.34 },
      { fruit: "Anggur",   configKey: "anggur",   hue: 282, sat: 0.62, val: 0.42, circ: 0.88, ar: 0.92 },
      { fruit: "Stroberi", configKey: "stroberi", hue: 352, sat: 0.87, val: 0.77, circ: 0.84, ar: 0.96 },
      { fruit: "Lemon",    configKey: "lemon",    hue: 55,  sat: 0.75, val: 0.85, circ: 0.83, ar: 1.18 },
      { fruit: "Ceri",     configKey: "ceri",     hue: 350, sat: 0.85, val: 0.65, circ: 0.94, ar: 1.00 },
      { fruit: "Mangga",   configKey: "mangga",   hue: 90,  sat: 0.60, val: 0.65, circ: 0.72, ar: 1.40 }, // green mango
    ];

    const hueDist = (h1: number, h2: number) => {
      const d = Math.abs(h1 - h2) % 360;
      return d > 180 ? 360 - d : d;
    };

    const classifyByPrototype = (hue: number, sat: number, val: number, circ: number, ar: number) => {
      let bestProto = PROTOTYPES[0];
      let bestScore = Infinity;
      for (const p of PROTOTYPES) {
        const score =
          (hueDist(hue, p.hue) / 180) * 2.5 +
          Math.abs(sat - p.sat) +
          Math.abs(val - p.val) +
          Math.abs(circ - p.circ) * 2.0 +
          Math.abs(ar - p.ar) * 0.5;
        if (score < bestScore) { bestScore = score; bestProto = p; }
      }
      return bestProto;
    };

    // Apply prototype override to all TEMP (uploaded) points
    for (const tid of tempIdList) {
      const rawItem = items.find(i => i.id === tid);
      if (!rawItem) continue;

      const proto = classifyByPrototype(
        rawItem.hue, rawItem.saturation, rawItem.value,
        rawItem.circularity, rawItem.aspectRatio
      );

      // Find the matching clusterConfig
      const config = clusterConfigs.find(c =>
        c.label.toLowerCase().includes(proto.configKey.toLowerCase())
      );

      const ptIdx = processedPoints.findIndex(p => p.id === tid);
      if (ptIdx !== -1) {
        processedPoints[ptIdx] = {
          ...processedPoints[ptIdx],
          cluster: config ? config.id : `C-${proto.fruit}`,
          clusterLabel: config ? config.label : `${proto.fruit}`,
        };
      }
    }
    // ── End prototype override ─────────────────────────────────────────────

    return {
      points: processedPoints,
      clusterCount: uniqueClusterIds.length,
      noiseCount: processedPoints.filter(p => p.clusterId === -1).length,
    };
  });
export const deleteClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data: id }: any) => {
    const db = await loadDb();
    db.clusterConfigs = db.clusterConfigs.filter(c => c.id !== id);
    await saveDb(db);
    return db.clusterConfigs;
  });

export const saveClusteringResults = createServerFn({ method: "POST" })
  .handler(async ({ data: { eps, minSamples, featureMode } }: any) => {
    const db = await loadDb();
    
    // Save settings
    db.dbscanSettings = { eps, minSamples, featureMode };
    
    // Run DBSCAN on all current items
    const weights = buildWeights(featureMode);
    const dbscanInputs: DBSCANInputPoint[] = db.items.map(item => ({
      id: item.id,
      features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio],
      item
    }));
    
    const normalized = normalizeFeatures(dbscanInputs);
    const clusterResults = runDBSCAN(normalized, eps, minSamples, weights);
    
    // Count dominant fruit type in each cluster
    const clusterFruitMapping = new Map<number, string>();
    const uniqueClusterIds = Array.from(new Set(Array.from(clusterResults.values()).map(v => v.clusterId))).filter(id => id !== -1);
    
    const pointsWithCid = db.items.map(item => {
      const res = clusterResults.get(item.id);
      return { ...item, clusterId: res ? res.clusterId : -1 };
    });
    
    for (const cid of uniqueClusterIds) {
      const clusterPoints = pointsWithCid.filter(p => p.clusterId === cid);
      const counts: Record<string, number> = {};
      for (const p of clusterPoints) {
        const fruit = p.fruit || "Unknown";
        counts[fruit] = (counts[fruit] || 0) + 1;
      }
      let dominantFruit = "Unknown";
      let maxCount = -1;
      for (const [fruit, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantFruit = fruit;
        }
      }
      clusterFruitMapping.set(cid, dominantFruit);
    }
    
    // Update all items in DB with their calculated clusters
    db.items = db.items.map(item => {
      const res = clusterResults.get(item.id);
      const clusterId = res ? res.clusterId : -1;
      const isCore = res ? res.isCore : false;
      const isBorder = res ? res.isBorder : false;
      const isNoise = res ? res.isNoise : true;
      
      let clusterLabel = "Derau (Noise)";
      let clusterIdStr = "C-6";
      
      const noiseConfig = db.clusterConfigs.find(c => c.label.includes("Derau") || c.label.includes("Noise"));
      if (noiseConfig) {
        clusterLabel = noiseConfig.label;
        clusterIdStr = noiseConfig.id;
      }
      
      if (clusterId !== -1) {
        const mappedFruit = clusterFruitMapping.get(clusterId);
        const config = db.clusterConfigs.find(c =>
          mappedFruit && c.label.toLowerCase().includes(mappedFruit.toLowerCase())
        );
        if (config) {
          clusterLabel = config.label;
          clusterIdStr = config.id;
        } else {
          clusterLabel = `Cluster ${clusterId + 1}`;
          clusterIdStr = `C-${clusterId + 1}`;
        }
      }
      
      return {
        ...item,
        clusterId,
        isCore,
        isBorder,
        isNoise,
        cluster: clusterIdStr,
        clusterLabel,
      };
    });
    
    await saveDb(db);
    return { success: true, settings: db.dbscanSettings };
  });

export const getScatterPlotData = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data?: { eps?: number; minSamples?: number; featureMode?: "color" | "shape" | "both" } } = {}) => {
    const db = await loadDb();
    const settings = {
      eps: data?.eps ?? db.dbscanSettings?.eps ?? 0.35,
      minSamples: data?.minSamples ?? db.dbscanSettings?.minSamples ?? 3,
      featureMode: data?.featureMode ?? db.dbscanSettings?.featureMode ?? "both"
    };

    // Build weights and run DBSCAN dynamically on all current items
    const weights = buildWeights(settings.featureMode);
    const dbscanInputs: DBSCANInputPoint[] = db.items.map(item => ({
      id: item.id,
      features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio],
      item
    }));

    const normalized = normalizeFeatures(dbscanInputs);

    let clusterResults: Map<string, any>;
    try {
      const path = await import("path");
      const { execSync } = await import("child_process");
      const scriptPath = path.resolve("src/lib/dbscan.py");
      const payload = JSON.stringify({
        points: dbscanInputs,
        eps: settings.eps,
        minSamples: settings.minSamples,
        weights: weights,
      });

      const output = execSync(`py -3 "${scriptPath}"`, {
        input: payload,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      const parsed = JSON.parse(output);
      clusterResults = new Map(Object.entries(parsed));
    } catch (err) {
      console.warn("Python DBSCAN failed in getScatterPlotData, falling back to TS:", err);
      clusterResults = runDBSCAN(normalized, settings.eps, settings.minSamples, weights);
    }

    // Count dominant fruit type in each cluster
    const clusterFruitMapping = new Map<number, string>();
    const uniqueClusterIds = Array.from(new Set(Array.from(clusterResults.values()).map(v => v.clusterId))).filter(id => id !== -1);

    const pointsWithCid = db.items.map(item => {
      const res = clusterResults.get(item.id);
      return { ...item, clusterId: res ? res.clusterId : -1 };
    });

    for (const cid of uniqueClusterIds) {
      const clusterPoints = pointsWithCid.filter(p => p.clusterId === cid);
      const counts: Record<string, number> = {};
      for (const p of clusterPoints) {
        const fruit = p.fruit || "Unknown";
        counts[fruit] = (counts[fruit] || 0) + 1;
      }
      let dominantFruit = "Unknown";
      let maxCount = -1;
      for (const [fruit, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantFruit = fruit;
        }
      }
      clusterFruitMapping.set(cid, dominantFruit);
    }

    const clusteredItems = db.items.map(item => {
      const res = clusterResults.get(item.id);
      const clusterId = res ? res.clusterId : -1;
      const isCore = res ? res.isCore : false;
      const isBorder = res ? res.isBorder : false;
      const isNoise = res ? res.isNoise : true;

      let clusterLabel = "Derau (Noise)";
      let clusterIdStr = "C-6";

      const noiseConfig = db.clusterConfigs.find(c => c.label.includes("Derau") || c.label.includes("Noise"));
      if (noiseConfig) {
        clusterLabel = noiseConfig.label;
        clusterIdStr = noiseConfig.id;
      }

      if (clusterId !== -1) {
        const mappedFruit = clusterFruitMapping.get(clusterId);
        const config = db.clusterConfigs.find(c =>
          mappedFruit && c.label.toLowerCase().includes(mappedFruit.toLowerCase())
        );
        if (config) {
          clusterLabel = config.label;
          clusterIdStr = config.id;
        } else {
          clusterLabel = `Cluster ${clusterId + 1}`;
          clusterIdStr = `C-${clusterId + 1}`;
        }
      }

      return {
        ...item,
        clusterId,
        isCore,
        isBorder,
        isNoise,
        cluster: clusterIdStr,
        clusterLabel,
      };
    });

    return {
      items: clusteredItems,
      settings: settings
    };
  });

export const getDbUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();
    return db.users || [];
  });

export const saveDbUsers = createServerFn({ method: "POST" })
  .handler(async ({ data: users }: any) => {
    const db = await loadDb();
    db.users = users;
    await saveDb(db);
    return db.users;
  });

import { createServerFn } from "@tanstack/react-start";
import { runDBSCAN, normalizeFeatures, DBSCANInputPoint } from "./dbscan";

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
  const fruitsList = ["Apple", "Orange", "Banana", "Mango", "Grape"];
  const fileNames = ["apple_red_01.jpg", "orange_02.jpg", "banana_ripe.jpg", "mango_green.jpg", "grape_purple.jpg"];
  const clusterMapping = ["C-1", "C-2", "C-3", "C-4", "C-5"];

  // Default features for each fruit type
  const baseFeatures: Record<string, { h: number, s: number, v: number, c: number, a: number, x: number, y: number }> = {
    "Apple": { h: 12, s: 0.8, v: 0.75, c: 0.92, a: 1.02, x: 25, y: 70 },
    "Orange": { h: 32, s: 0.85, v: 0.8, c: 0.96, a: 0.98, x: 55, y: 60 },
    "Banana": { h: 52, s: 0.9, v: 0.88, c: 0.42, a: 2.4, x: 75, y: 80 },
    "Mango": { h: 42, s: 0.72, v: 0.76, c: 0.76, a: 1.34, x: 40, y: 35 },
    "Grape": { h: 282, s: 0.62, v: 0.42, c: 0.88, a: 0.92, x: 80, y: 30 },
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
      hue: Math.round((base.h + seed * 10) % 360),
      saturation: Math.min(1, Math.max(0, base.s + (i % 2 === 0 ? seed : -seed) * 0.1)),
      value: Math.min(1, Math.max(0, base.v + (i % 2 === 1 ? seed : -seed) * 0.1)),
      circularity: Math.min(1, Math.max(0, base.c + (i % 2 === 0 ? seed : -seed) * 0.05)),
      aspectRatio: Math.max(0.5, base.a + (i % 2 === 1 ? seed : -seed) * 0.15),
      x: Math.round(base.x + (i % 2 === 0 ? 3 : -3)),
      y: Math.round(base.y + (i % 2 === 1 ? 3 : -3)),
      isSynthetic: false,
    });
  }

  // Generate 120 synthetic scatter data points
  // centers align with clusters in mock-data.ts
  const centers = [
    [25, 70], [55, 60], [75, 80], [40, 35], [80, 30], [50, 50],
  ];
  const clusterFruitNames = ["Apple", "Orange", "Banana", "Mango", "Grape", "Noise"];

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

  return { items, clusterConfigs: configs };
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

  if (memoryDb) return memoryDb;

  try {
    const fs = await import("fs/promises");
    const dbPath = await getDbPath();
    const data = await fs.readFile(dbPath, "utf-8");
    memoryDb = JSON.parse(data);
    return memoryDb!;
  } catch (error) {
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
  .handler(async ({ data }: { data: Omit<FruitItem, "id" | "uploaded" | "isSynthetic"> }) => {
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
  .handler(async ({ data: id }: { data: string }) => {
    const db = await loadDb();
    db.items = db.items.filter(i => i.id !== id);
    await saveDb(db);
    return { success: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = await loadDb();
    
    const totalDataset = db.items.filter(i => !i.isSynthetic).length;
    const totalAnalysis = db.items.length; // total points in system
    
    // Run a default DBSCAN to estimate clusters
    // Using eps=0.3, minSamples=4, featureMode=both
    const dbscanInputs: DBSCANInputPoint[] = db.items.map(item => ({
      id: item.id,
      features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio]
    }));
    const normalized = normalizeFeatures(dbscanInputs);
    const clusterResults = runDBSCAN(normalized, 0.3, 4, [1, 1, 1, 1, 1]);
    
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
      ],
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

export const updateClusterConfigs = createServerFn({ method: "POST" })
  .handler(async ({ data: configs }: { data: ClusterConfig[] }) => {
    const db = await loadDb();
    db.clusterConfigs = configs;
    await saveDb(db);
    return configs;
  });
export const updateClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data: config }: { data: ClusterConfig }) => {
    const db = await loadDb();
    db.clusterConfigs = db.clusterConfigs.map(c => c.id === config.id ? config : c);
    await saveDb(db);
    return db.clusterConfigs;
  });
export const addClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: Omit<ClusterConfig, "id"> }) => {
    const db = await loadDb();
    const nextId = `C-${db.clusterConfigs.length + 1}`;
    const newConfig = { ...data, id: nextId };
    db.clusterConfigs.push(newConfig);
    await saveDb(db);
    return newConfig;
  });
export const runDBSCANClustering = createServerFn({ method: "POST" })
  .handler(async ({ data: { eps, minSamples, featureMode, tempPoint, tempPoints } }: {
    data: {
      eps: number;
      minSamples: number;
      featureMode: "color" | "shape" | "both";
      tempPoint?: {
        hue: number;
        saturation: number;
        value: number;
        circularity: number;
        aspectRatio: number;
        fruit?: string;
      };
      tempPoints?: Array<{
        id?: string;
        name?: string;
        hue: number;
        saturation: number;
        value: number;
        circularity: number;
        aspectRatio: number;
        fruit?: string;
        imageUrl?: string;
      }>;
    };
  }) => {
    const db = await loadDb();
    
    // Define weights based on featureMode
    // features: [hue, saturation, value, circularity, aspectRatio]
    let weights = [1, 1, 1, 1, 1];
    if (featureMode === "color") {
      weights = [1.5, 1.0, 1.0, 0, 0];
    } else if (featureMode === "shape") {
      weights = [0, 0, 0, 1.5, 1.0];
    }

    const items = [...db.items];
    
    if (tempPoints && tempPoints.length > 0) {
      tempPoints.forEach((tp, idx) => {
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

    // Run DBSCAN
    const clusterResults = runDBSCAN(normalized, eps, minSamples, weights);

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
      let clusterLabel = "Noise";
      let clusterIdStr = "C-6";

      if (pt.clusterId !== -1) {
        const mappedFruit = clusterFruitMapping.get(pt.clusterId!);
        const config = clusterConfigs.find(c => c.label.startsWith(mappedFruit || ""));
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

    return {
      points: processedPoints,
      clusterCount: uniqueClusterIds.length,
      noiseCount: processedPoints.filter(p => p.clusterId === -1).length,
    };
  });
export const deleteClusterConfigItem = createServerFn({ method: "POST" })
  .handler(async ({ data: id }: { data: string }) => {
    const db = await loadDb();
    db.clusterConfigs = db.clusterConfigs.filter(c => c.id !== id);
    await saveDb(db);
    return db.clusterConfigs;
  });

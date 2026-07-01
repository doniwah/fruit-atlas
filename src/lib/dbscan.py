import sys
import json
import math

def circular_hue_distance(h1, h2):
    d = abs(h1 - h2) % 360
    return 360 - d if d > 180 else d

def normalize_features(points):
    if not points:
        return []
    
    n_points = len(points)
    # Features: [hue, sat, val, circ, ar]
    num_features = len(points[0]['features'])
    
    # Calculate min-max for non-hue features (index 1 to end)
    mins = [float('inf')] * num_features
    maxs = [float('-inf')] * num_features
    
    for p in points:
        for i in range(1, num_features):
            v = p['features'][i]
            if v < mins[i]:
                mins[i] = v
            if v > maxs[i]:
                maxs[i] = v
                
    normalized = []
    for p in points:
        hue = p['features'][0]
        # Encode hue circularity using sin and cos shifted to [0, 1]
        hue_rad = (hue / 360.0) * 2.0 * math.pi
        sin_h = (math.sin(hue_rad) + 1.0) / 2.0
        cos_h = (math.cos(hue_rad) + 1.0) / 2.0
        
        rest = []
        for i in range(1, num_features):
            range_val = maxs[i] - mins[i]
            if range_val == 0:
                rest.append(0.5)
            else:
                rest.append((p['features'][i] - mins[i]) / range_val)
                
        normalized.append({
            'id': p['id'],
            'features': [sin_h, cos_h] + rest,
            'raw_features': p['features']
        })
        
    return normalized

def euclidean_distance(a, b, weights):
    sum_sq = 0.0
    weight_sum = 0.0
    for i in range(len(a)):
        w = weights[i] if i < len(weights) else 1.0
        sum_sq += w * ((a[i] - b[i]) ** 2)
        weight_sum += w
    return math.sqrt(sum_sq / (weight_sum or 1.0))

def run_dbscan(points, eps, min_samples, weights):
    n = len(points)
    results = {
        p['id']: {
            'clusterId': -1,
            'isCore': False,
            'isBorder': False,
            'isNoise': True
        } for p in points
    }
    
    if n == 0:
        return results
        
    def get_neighbors(idx):
        neighbors = []
        p1 = points[idx]
        for i in range(n):
            if euclidean_distance(p1['features'], points[i]['features'], weights) <= eps:
                neighbors.append(i)
        return neighbors

    visited = set()
    current_cluster_id = 0
    
    for i in range(n):
        if i in visited:
            continue
        visited.add(i)
        
        neighbors = get_neighbors(i)
        if len(neighbors) < min_samples:
            continue
            
        # Core point found
        results[points[i]['id']] = {
            'clusterId': current_cluster_id,
            'isCore': True,
            'isBorder': False,
            'isNoise': False
        }
        
        queue = [idx for idx in neighbors if idx != i]
        q_idx = 0
        while q_idx < len(queue):
            neighbor_idx = queue[q_idx]
            
            if neighbor_idx not in visited:
                visited.add(neighbor_idx)
                nn = get_neighbors(neighbor_idx)
                
                if len(nn) >= min_samples:
                    for nn_idx in nn:
                        if nn_idx not in queue and nn_idx != i:
                            queue.append(nn_idx)
                    results[points[neighbor_idx]['id']] = {
                        'clusterId': current_cluster_id,
                        'isCore': True,
                        'isBorder': False,
                        'isNoise': False
                    }
                else:
                    results[points[neighbor_idx]['id']] = {
                        'clusterId': current_cluster_id,
                        'isCore': False,
                        'isBorder': True,
                        'isNoise': False
                    }
            else:
                curr = results[points[neighbor_idx]['id']]
                if curr['clusterId'] == -1:
                    results[points[neighbor_idx]['id']] = {
                        'clusterId': current_cluster_id,
                        'isCore': curr['isCore'],
                        'isBorder': not curr['isCore'],
                        'isNoise': False
                    }
            q_idx += 1
            
        current_cluster_id += 1
        
    return results

def main():
    try:
        input_data = json.load(sys.stdin)
        points = input_data.get('points', [])
        eps = input_data.get('eps', 0.35)
        min_samples = input_data.get('minSamples', 3)
        weights = input_data.get('weights', [1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
        
        normalized = normalize_features(points)
        results = run_dbscan(normalized, eps, min_samples, weights)
        
        print(json.dumps(results))
    except Exception as e:
        sys.stderr.write(str(e) + "\n")
        sys.exit(1)

if __name__ == '__main__':
    main()

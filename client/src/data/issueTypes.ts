import { IssueCategory } from '@/types';

export const issueCategories: IssueCategory[] = [
  {
    id: 'roads-traffic',
    name: 'Roads & Traffic',
    color: '#E53935',
    icon: 'road',
    subcategories: [
      { id: 'pothole', name: 'Potholes', icon: 'pothole' },
      { id: 'road-markings', name: 'Faded/Missing Road Markings', icon: 'paintBucket' },
      { id: 'road-signs', name: 'Damaged/Missing Road Signs', icon: 'signpost' },
      { id: 'traffic-lights', name: 'Malfunctioning Traffic Lights', icon: 'trafficLight' },
      { id: 'sidewalks', name: 'Damaged Sidewalks', icon: 'footprints' },
      { id: 'road-dumping', name: 'Illegal Dumping on Roads', icon: 'trash' }
    ]
  },
  {
    id: 'street-lighting',
    name: 'Street Lighting',
    color: '#FFC107',
    icon: 'lightbulb',
    subcategories: [
      { id: 'non-functional-light', name: 'Non-functional Streetlight', icon: 'lightbulbOff' },
      { id: 'flickering-light', name: 'Flickering/Intermittent Light', icon: 'lightbulb' },
      { id: 'exposed-wiring', name: 'Exposed Wiring/Damaged Pole', icon: 'zap' },
      { id: 'obstructed-light', name: 'Light Obstructed by Vegetation', icon: 'trees' }
    ]
  },
  {
    id: 'electricity',
    name: 'Electricity',
    color: '#FF9800',
    icon: 'zap',
    subcategories: [
      { id: 'downed-lines', name: 'Downed/Exposed Power Lines', icon: 'bolt' },
      { id: 'damaged-substation', name: 'Damaged Electrical Substation', icon: 'box' },
      { id: 'open-electrical-box', name: 'Open Electrical Box', icon: 'square' },
      { id: 'broken-electrical-box', name: 'Broken Electrical Box', icon: 'squareX' }
    ]
  },
  {
    id: 'water-sanitation',
    name: 'Water & Sanitation',
    color: '#2196F3',
    icon: 'droplets',
    subcategories: [
      { id: 'burst-pipe', name: 'Burst Water Pipe', icon: 'pipe' },
      { id: 'leaking-meter', name: 'Leaking Water Meter', icon: 'gauge' },
      { id: 'blocked-drain', name: 'Blocked/Overflowing Drain', icon: 'trash' },
      { id: 'sewage-spill', name: 'Sewage Spill/Blockage', icon: 'wind' },
      { id: 'public-toilet', name: 'Non-functional Public Toilet', icon: 'toilet' }
    ]
  },
  {
    id: 'waste-management',
    name: 'Waste Management',
    color: '#4CAF50',
    icon: 'trash',
    subcategories: [
      { id: 'overflowing-bin', name: 'Overflowing Public Bin', icon: 'trashFull' },
      { id: 'illegal-dumping', name: 'Illegal Dumping Site', icon: 'wasteBasket' }
    ]
  },
  {
    id: 'public-facilities',
    name: 'Public Facilities',
    color: '#9C27B0',
    icon: 'building',
    subcategories: [
      { id: 'vandalized-spaces', name: 'Damaged/Vandalized Public Space', icon: 'building' },
      { id: 'broken-playground', name: 'Broken Playground Equipment', icon: 'playground' },
      { id: 'non-functional-fountain', name: 'Non-functional Public Fountain', icon: 'shower' },
      { id: 'graffiti', name: 'Graffiti on Public Structures', icon: 'brush' }
    ]
  },
  {
    id: 'parks-recreation',
    name: 'Parks & Recreation',
    color: '#8BC34A',
    icon: 'palmtree',
    subcategories: [
      { id: 'overgrown-grass', name: 'Overgrown Grass/Unmaintained Landscape', icon: 'scissors' },
      { id: 'damaged-fencing', name: 'Damaged Fencing', icon: 'fence' },
      { id: 'unsafe-trails', name: 'Unsafe/Broken Walking Trails', icon: 'route' }
    ]
  },
  {
    id: 'environmental',
    name: 'Environmental Concerns',
    color: '#009688',
    icon: 'mountain',
    subcategories: [
      { id: 'polluted-rivers', name: 'Blocked/Polluted Rivers and Streams', icon: 'wave' }
    ]
  },
  {
    id: 'animal-control',
    name: 'Animal Control',
    color: '#795548',
    icon: 'paw',
    subcategories: [
      { id: 'dead-animal', name: 'Dead Animal on Public Road/Space', icon: 'skull' }
    ]
  },
  {
    id: 'urban-infrastructure',
    name: 'Urban Infrastructure',
    color: '#607D8B',
    icon: 'building',
    subcategories: [
      { id: 'open-manhole', name: 'Open/Missing Manhole Cover', icon: 'circle' },
      { id: 'stormwater-grate', name: 'Damaged/Missing Stormwater Grate', icon: 'grid' },
      { id: 'construction-site', name: 'Unsecured Construction Site', icon: 'hammer' }
    ]
  }
];

// Helper function to get all issue types flattened
export function getAllIssueTypes() {
  const allTypes: { id: string; name: string; icon: string; categoryId: string; categoryName: string; color: string }[] = [];
  
  issueCategories.forEach(category => {
    category.subcategories.forEach(subcategory => {
      allTypes.push({
        id: subcategory.id,
        name: subcategory.name,
        icon: subcategory.icon,
        categoryId: category.id,
        categoryName: category.name,
        color: category.color
      });
    });
  });
  
  return allTypes;
}

// Helper to get issue type by ID
export function getIssueTypeById(id: string) {
  const allTypes = getAllIssueTypes();
  return allTypes.find(type => type.id === id);
}

// Helper to get category by ID
export function getCategoryById(id: string) {
  return issueCategories.find(category => category.id === id);
}
export interface IssueSubcategory {
  id: string;
  name: string;
  icon: string;
}

export interface IssueCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: IssueSubcategory[];
}

export interface IssueType {
  id: string;
  name: string;
  icon: string;
  color: string;
  categoryId?: string;
  categoryName?: string;
}

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface ReportFormData {
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
  photo?: File;
  reportId: string;
  status: string;
}

export interface Issue {
  id: number;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
  photoUrl?: string;
  status: string;
  upvotes: number;
  reportId: string;
  createdAt: Date;
}

export interface MapMarker {
  id: number;
  position: google.maps.LatLngLiteral;
  type: string;
}

export interface HeatmapData {
  positions: google.maps.LatLngLiteral[];
  weights?: number[];
}

export interface DeviceInfo {
  deviceId: string;
}

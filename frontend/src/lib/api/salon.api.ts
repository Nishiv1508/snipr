import { api } from "@/lib/api";

export type SalonStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface SalonServiceInput {
  name: string;
  description?: string;
  durationMin: number;
  price: number;
}

export interface SalonHoursInput {
  day: WeekDay;
  opensAt?: string;
  closesAt?: string;
  isClosed: boolean;
}

export interface CreateSalonInput {
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  googleMapsUrl: string;
  services: SalonServiceInput[];
  hours: SalonHoursInput[];
}

export type UpdateSalonInput = Partial<CreateSalonInput>;

export interface SalonService extends SalonServiceInput {
  id: string;
  isActive: boolean;
}

export interface Salon {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address: string;
  city: string;
  state: string;
  postalCode?: string | null;
  phone?: string | null;
  googleMapsUrl?: string | null;
  status: SalonStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  services?: SalonService[];
  hours?: SalonHoursInput[];
}

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object") {
    const result = data as Record<string, unknown>;

    if ("salon" in result) return result.salon as T;
    if ("data" in result) return result.data as T;
  }

  return data as T;
}

export async function getMySalons(): Promise<Salon[]> {
  const response = await api.get("/salons/mine");
  const data = response.data;

  if (Array.isArray(data)) return data as Salon[];
  if (Array.isArray(data?.salons)) return data.salons as Salon[];
  if (Array.isArray(data?.data)) return data.data as Salon[];

  return [];
}

export async function getSalonById(id: string): Promise<Salon> {
  const response = await api.get(`/salons/${id}`);
  return unwrap<Salon>(response.data);
}

export async function createSalon(input: CreateSalonInput): Promise<Salon> {
  const response = await api.post("/salons", input);
  return unwrap<Salon>(response.data);
}

export async function updateSalon(
  id: string,
  input: UpdateSalonInput,
): Promise<Salon> {
  const response = await api.patch(`/salons/${id}`, input);
  return unwrap<Salon>(response.data);
}

export async function publishSalon(id: string): Promise<void> {
  await api.post(`/salons/${id}/publish`);
}

export async function unpublishSalon(id: string): Promise<void> {
  await api.post(`/salons/${id}/unpublish`);
}

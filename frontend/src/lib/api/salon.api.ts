import { api } from "@/lib/api";

export interface Salon {
  id: string; ownerId: string; name: string; phone: string;
  description: string | null; addressLine1: string; addressLine2: string | null;
  city: string; state: string; postalCode: string; country: string;
  createdAt: string; updatedAt: string;
}
export type CreateSalonInput = {
  name: string; phone: string; description?: string; addressLine1: string;
  addressLine2?: string; city: string; state: string; postalCode: string; country: string;
};
export async function listMySalons(): Promise<Salon[]> {
  const response = await api.get("/salons/mine");
  return response.data.data.salons as Salon[];
}
export async function createSalon(input: CreateSalonInput): Promise<Salon> {
  const response = await api.post("/salons", input);
  return response.data.data.salon as Salon;
}

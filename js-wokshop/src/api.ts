import axios from 'axios'
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000'
const TOKEN = import.meta.env.VITE_TOKEN ?? ''

// ajuste o path caso sua API seja /api/workshops
const WORKSHOPS_PATH = '/api/Workshops'

const getHeaders = () => {
    return {
        Authorization: 'Bearer ${TOKEN}'
    }
}
export async function searchWorkshops(q: string): Promise<WorkshopList> {
  const { data } = await axios.get<WorkshopList>(
    `${API_BASE}${WORKSHOPS_PATH}`,
    { params: { q }, headers: getHeaders() }
  );
  return data;
}

// src/api.ts
export type Workshop = {
  Id: string;
  Title: string;            // [Required(ErrorMessage = "Título é obrigatório")]
  Description: string;      // [StringLength(2000, ErrorMessage = "Descrição não pode exceder 2000 caracteres")]
  StartAt: string;          // ISO string [Required(ErrorMessage = "Data de início é obrigatória")]
  EndAt: string;            // ISO string [Required(ErrorMessage = "Data de fim é obrigatória")]
                            // Location deve ser obrigatório se IsOnline == false (validado no controller)
  Location?: string | null; // [StringLength(200, ErrorMessage = "Localização não pode exceder 200 caracteres")]
  Capacity?: number;        // [Range(1, 1000, ErrorMessage = "Capacidade deve estar entre 1 e 1000")]
  IsOnline: boolean;

};


export type WorkshopList = Workshop[];

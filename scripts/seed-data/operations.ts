import { CATEGORIES } from "./constants";

export type SeedOperation = {
  client_email: string;
  business_email: string;
  category: (typeof CATEGORIES)[number];
  redemption_code: string;
  status: "pending_pickup" | "completed" | "disputed";
  accepted_at: string;
};

export const OPERATIONS: SeedOperation[] = [
  {
    client_email: "cliente5@empenalo.test",
    business_email: "negocio3@empenalo.test",
    category: "celular",
    redemption_code: "EMP-7K2X9",
    status: "pending_pickup",
    accepted_at: "2026-05-24T18:30:00Z",
  },
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "joya",
    redemption_code: "EMP-A3B5N",
    status: "completed",
    accepted_at: "2026-05-20T14:00:00Z",
  },
  {
    client_email: "cliente6@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "otro",
    redemption_code: "EMP-H8R4Q",
    status: "disputed",
    accepted_at: "2026-05-22T11:15:00Z",
  },
];

import { PLAN_SLUGS } from "./constants";

export type SeedClientUser = {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  document_number: string;
  phone: string;
  district: string;
};

export type SeedBusinessUser = {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  document_number: string;
  phone: string;
  district: string;
  business_name: string;
  legal_name: string;
  ruc: string;
  verified: boolean;
  plan_slug: (typeof PLAN_SLUGS)[number];
};

export const CLIENT_USERS: SeedClientUser[] = [
  {
    email: "cliente1@empenalo.test",
    full_name: "María González",
    first_name: "María",
    last_name: "González",
    document_number: "40000001",
    phone: "+51 999 100 001",
    district: "Miraflores",
  },
  {
    email: "cliente2@empenalo.test",
    full_name: "Carlos Mendoza",
    first_name: "Carlos",
    last_name: "Mendoza",
    document_number: "40000002",
    phone: "+51 999 100 002",
    district: "San Isidro",
  },
  {
    email: "cliente3@empenalo.test",
    full_name: "Lucía Torres",
    first_name: "Lucía",
    last_name: "Torres",
    document_number: "40000003",
    phone: "+51 999 100 003",
    district: "Santiago de Surco",
  },
  {
    email: "cliente4@empenalo.test",
    full_name: "Javier Ruiz",
    first_name: "Javier",
    last_name: "Ruiz",
    document_number: "40000004",
    phone: "+51 999 100 004",
    district: "San Borja",
  },
  {
    email: "cliente5@empenalo.test",
    full_name: "Ana Castillo",
    first_name: "Ana",
    last_name: "Castillo",
    document_number: "40000005",
    phone: "+51 999 100 005",
    district: "La Molina",
  },
  {
    email: "cliente6@empenalo.test",
    full_name: "Diego Paredes",
    first_name: "Diego",
    last_name: "Paredes",
    document_number: "40000006",
    phone: "+51 999 100 006",
    district: "Miraflores",
  },
  {
    email: "cliente7@empenalo.test",
    full_name: "Valeria Quispe",
    first_name: "Valeria",
    last_name: "Quispe",
    document_number: "40000007",
    phone: "+51 999 100 007",
    district: "Barranco",
  },
  {
    email: "cliente8@empenalo.test",
    full_name: "Renato Salas",
    first_name: "Renato",
    last_name: "Salas",
    document_number: "40000008",
    phone: "+51 999 100 008",
    district: "Surquillo",
  },
];

export const BUSINESS_USERS: SeedBusinessUser[] = [
  {
    email: "negocio1@empenalo.test",
    full_name: "Pedro Sánchez",
    first_name: "Pedro",
    last_name: "Sánchez",
    document_number: "40000101",
    phone: "+51 999 200 001",
    district: "Miraflores",
    business_name: "Joyería Miraflores",
    legal_name: "Joyería Miraflores S.A.C.",
    ruc: "20100000001",
    verified: true,
    plan_slug: "intermedio",
  },
  {
    email: "negocio2@empenalo.test",
    full_name: "Rosa Díaz",
    first_name: "Rosa",
    last_name: "Díaz",
    document_number: "40000102",
    phone: "+51 999 200 002",
    district: "San Isidro",
    business_name: "Empeños San Isidro",
    legal_name: "Empeños San Isidro E.I.R.L.",
    ruc: "20100000002",
    verified: true,
    plan_slug: "avanzado",
  },
  {
    email: "negocio3@empenalo.test",
    full_name: "Luis Herrera",
    first_name: "Luis",
    last_name: "Herrera",
    document_number: "40000103",
    phone: "+51 999 200 003",
    district: "Santiago de Surco",
    business_name: "Casa Oro Surco",
    legal_name: "Casa Oro Surco S.A.C.",
    ruc: "20100000003",
    verified: true,
    plan_slug: "avanzado",
  },
  {
    email: "negocio4@empenalo.test",
    full_name: "Diana Flores",
    first_name: "Diana",
    last_name: "Flores",
    document_number: "40000104",
    phone: "+51 999 200 004",
    district: "San Borja",
    business_name: "Préstamos San Borja",
    legal_name: "Préstamos San Borja S.A.C.",
    ruc: "20100000004",
    verified: false,
    plan_slug: "basico",
  },
  {
    email: "negocio5@empenalo.test",
    full_name: "Miguel Vargas",
    first_name: "Miguel",
    last_name: "Vargas",
    document_number: "40000105",
    phone: "+51 999 200 005",
    district: "Miraflores",
    business_name: "Oro Express Miraflores",
    legal_name: "Oro Express Miraflores S.A.C.",
    ruc: "20100000005",
    verified: false,
    plan_slug: "intermedio",
  },
];

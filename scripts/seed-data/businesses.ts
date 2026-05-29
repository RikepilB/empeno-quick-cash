export type BusinessProfileExtras = {
  address: string;
  city: string;
};

export const BUSINESS_PROFILE_EXTRAS: Record<string, BusinessProfileExtras> = {
  "negocio1@empenalo.test": {
    address: "Av. Larco 345, Miraflores",
    city: "Lima",
  },
  "negocio2@empenalo.test": {
    address: "Av. Javier Prado Este 1234, San Isidro",
    city: "Lima",
  },
  "negocio3@empenalo.test": {
    address: "Av. Caminos del Inca 980, Santiago de Surco",
    city: "Lima",
  },
  "negocio4@empenalo.test": {
    address: "Av. Aviación 2455, San Borja",
    city: "Lima",
  },
  "negocio5@empenalo.test": {
    address: "Av. Pardo 720, Miraflores",
    city: "Lima",
  },
};

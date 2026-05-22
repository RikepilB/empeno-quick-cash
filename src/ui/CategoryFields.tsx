import { type CategoryKey } from "@/lib/categories";
import { CelularFields } from "@/lib/categories/celular/index";
import { LaptopFields } from "@/lib/categories/laptop/index";
import { JoyaFields } from "@/lib/categories/joya/index";
import { RelojFields } from "@/lib/categories/reloj/index";
import { VehiculoFields } from "@/lib/categories/vehiculo/index";
import { OtroFields } from "@/lib/categories/otro/index";

export function CategoryFields({ category }: { category: CategoryKey }) {
  switch (category) {
    case "celular":
      return <CelularFields />;
    case "laptop":
      return <LaptopFields />;
    case "joya":
      return <JoyaFields />;
    case "reloj":
      return <RelojFields />;
    case "vehiculo":
      return <VehiculoFields />;
    case "otro":
      return <OtroFields />;
    default:
      return null;
  }
}

export interface SerializedVariant {
  id: string;
  label: string;
  retailPriceCents: number;
}

export interface SerializedProduct {
  id: string;
  imageUrl: string | null;
  name: string;
  roastLevel: string;
  variants: SerializedVariant[];
}

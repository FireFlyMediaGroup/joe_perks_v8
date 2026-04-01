export type SerializedVariant = {
  id: string;
  label: string;
  retailPriceCents: number;
};

export type SerializedProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  roastLevel: string;
  variants: SerializedVariant[];
};

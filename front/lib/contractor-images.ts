const contractorImageIds = new Set(
  (process.env.NEXT_PUBLIC_CONTRACTOR_IMAGE_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

export function hasContractorImage(id: string): boolean {
  return contractorImageIds.has(id);
}

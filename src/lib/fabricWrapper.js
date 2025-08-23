export async function getFabric() {
    const mod = await import("fabric");
    return mod.fabric || mod.default || mod;
  }
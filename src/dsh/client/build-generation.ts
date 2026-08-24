/** Build-time marker used only for lifecycle/HMR acceptance handshakes. */
declare const __VEHICLE_PET_CLIENT_GENERATION__: string

export const vehiclePetClientGeneration = typeof __VEHICLE_PET_CLIENT_GENERATION__ === 'undefined'
  ? 'source'
  : __VEHICLE_PET_CLIENT_GENERATION__

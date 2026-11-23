import { Member, VehicleCode, VehicleInfo } from '../types/ridesplit';

export const MEMBERS: readonly Member[] = ['Varun', 'Yashasvi', 'Vrishank'] as const;

export const VEHICLES: Record<VehicleCode, VehicleInfo> = {
  VC: {
    code: 'VC',
    owner: 'Varun',
    type: 'Car',
    label: "Varun's Car",
    cost: 315,
  },
  YC: {
    code: 'YC',
    owner: 'Yashasvi',
    type: 'Car',
    label: "Yashasvi's Car",
    cost: 330,
  },
  VRC: {
    code: 'VRC',
    owner: 'Vrishank',
    type: 'Car',
    label: "Vrishank's Car",
    cost: 330,
  },
  VB: {
    code: 'VB',
    owner: 'Varun',
    type: 'Bike',
    label: "Varun's Bike",
    cost: 150,
  },
  YB: {
    code: 'YB',
    owner: 'Yashasvi',
    type: 'Bike',
    label: "Yashasvi's Bike",
    cost: 150,
  },
  VRB: {
    code: 'VRB',
    owner: 'Vrishank',
    type: 'Bike',
    label: "Vrishank's Bike",
    cost: 150,
  },
};

export const VEHICLE_LIST: VehicleInfo[] = [
  VEHICLES.VC,
  VEHICLES.YC,
  VEHICLES.VRC,
  VEHICLES.VB,
  VEHICLES.YB,
  VEHICLES.VRB,
];

export const VEHICLE_CODES: VehicleCode[] = ['VC', 'YC', 'VRC', 'VB', 'YB', 'VRB'];

export const MEMBER_ACCENT_STYLES: Record<
  Member,
  {
    text: string;
    bg: string;
    border: string;
    bar: string;
    initial: string;
  }
> = {
  Varun: {
    text: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    bar: 'bg-slate-800',
    initial: 'V',
  },
  Yashasvi: {
    text: 'text-teal-800',
    bg: 'bg-teal-50/80',
    border: 'border-teal-200',
    bar: 'bg-teal-700',
    initial: 'Y',
  },
  Vrishank: {
    text: 'text-indigo-900',
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    bar: 'bg-indigo-700',
    initial: 'VR',
  },
};

export function isValidVehicleCode(value: string): value is VehicleCode {
  return VEHICLE_CODES.includes(value.toUpperCase() as VehicleCode);
}

/**
 * Parses a free-text input like "VC, YB" or "vc + vrc" into valid codes and unknown tokens.
 */
export function parseVehicleInput(input: string): {
  validCodes: VehicleCode[];
  invalidTokens: string[];
} {
  const tokens = input
    .split(/[\s,+/;|&]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const validCodes: VehicleCode[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    if (isValidVehicleCode(token)) {
      if (!validCodes.includes(token)) {
        validCodes.push(token);
      }
    } else {
      invalidTokens.push(token);
    }
  }

  return { validCodes, invalidTokens };
}

export function getCodeByOwnerAndType(owner: Member, type: 'Car' | 'Bike'): VehicleCode {
  const found = VEHICLE_LIST.find((v) => v.owner === owner && v.type === type);
  return found ? found.code : 'VC';
}

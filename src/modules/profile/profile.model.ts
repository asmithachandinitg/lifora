export type Gender = 'male' | 'female' | 'other' | '';

export interface ModuleToggle {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
}

export interface UserProfile {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  gender: Gender;
  dob: string;
  age?: number;
  country: string;
  state: string;
  city: string;
  weight: number;
  height: number;
  bmi?: number;
  profilePhoto?: string;
  modules?: { key: string; enabled: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}



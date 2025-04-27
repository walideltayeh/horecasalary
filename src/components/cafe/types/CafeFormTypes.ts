export interface CafeFormState {
  name: string;
  ownerName: string;
  ownerNumber: string;
  numberOfHookahs: number;
  numberOfTables: number;
  status: 'Pending' | 'Visited' | 'Contracted';
  photoUrl: string;
  governorate: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface CafeFormProps {
  formState: CafeFormState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange?: (name: string, value: string) => void;
  cafeSize?: string;
  availableCities?: string[];
}

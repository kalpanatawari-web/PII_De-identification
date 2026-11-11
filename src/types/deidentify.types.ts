export type EntityType =
  | 'EMAIL'
  | 'PHONE'
  | 'SSN'
  | 'DOB'
  | 'CREDIT_CARD'
  | 'IP_ADDRESS';


export interface DeidentifyResponse {
  originalText: string;
  deidentifiedText: string;
  detectedEntities: EntityType[];
}


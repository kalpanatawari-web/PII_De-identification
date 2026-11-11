import { DeidentifyResponse, EntityType } from "../types/deidentify.types";


class DeidentifyService {

  private readonly patterns: Record<EntityType, RegExp> = {
    EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,

    PHONE: /\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,

    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,

    DOB: /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g,

    CREDIT_CARD: /\b(?:\d[ -]?){13,19}\b/g,

    IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  };

  deidentifyText(text: string): DeidentifyResponse {
    let result = text;

    const detectedEntities: EntityType[] = [];
    const entities = Object.keys(this.patterns) as EntityType[];
    for (const entity of entities) {
      const regex = this.patterns[entity];

      result = result.replace(regex, (match) => {
        if (!this.isValidEntity(entity, match)) {
          return match;
        }

        if (!detectedEntities.includes(entity)) {
          detectedEntities.push(entity);
        }

        return `[${entity}]`;
      });
    }

    return {
      originalText: text,
      deidentifiedText: result,
      detectedEntities,
    };
  }

  isValidEntity(entity: EntityType, value: string): boolean {
    switch (entity) {
      case 'IP_ADDRESS':
        return value.split('.').every(
          (part) => Number(part) >= 0 && Number(part) <= 255
        );

      case 'CREDIT_CARD':
        return this.luhnCheck(value);

      case 'SSN':
        return !/^000|666|9\d{2}/.test(value) &&
          !/^\d{3}-00-\d{4}$/.test(value) &&
          !/^\d{3}-\d{2}-0000$/.test(value);

      default:
        return true;
    }
  }

  luhnCheck(value: string): boolean {
    const digits = value.replace(/\D/g, '');

    if (digits.length < 13 || digits.length > 19) {//13 to 19 check
      return false;
    }

    let sum = 0;
    let doubleDigit = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number(digits[i]);

      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      doubleDigit = !doubleDigit;
    }

    return sum % 10 === 0;
  }
  
}

export const deidentifyService = new DeidentifyService();



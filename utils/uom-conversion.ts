/**
 * Utility functions for unit of measure (UoM) conversions
 */

// Standard conversion factors
const CONVERSION_FACTORS: Record<string, Record<string, number>> = {
  // Volume conversions
  'L': {
    'mL': 1000,
    'L': 1,
  },
  'mL': {
    'L': 0.001,
    'mL': 1,
  },
  // Weight conversions
  'kg': {
    'g': 1000,
    'kg': 1,
  },
  'g': {
    'kg': 0.001,
    'g': 1,
  },
  // Length conversions
  'm': {
    'cm': 100,
    'mm': 1000,
    'm': 1,
  },
  'cm': {
    'm': 0.01,
    'mm': 10,
    'cm': 1,
  },
  'mm': {
    'm': 0.001,
    'cm': 0.1,
    'mm': 1,
  },
  // Default for same units
  'default': {
    'default': 1,
  },
};

/**
 * Convert a value from one unit to another
 * @param value The value to convert
 * @param fromUnit The unit to convert from
 * @param toUnit The unit to convert to
 * @returns The converted value
 */
export function convertUoM(value: number, fromUnit: string, toUnit: string): number {
  console.log(`Converting ${value} from ${fromUnit} to ${toUnit}`);

  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    console.log('Units are the same, no conversion needed');
    return value;
  }

  // Normalize units by removing any whitespace and converting to lowercase
  const normalizedFromUnit = fromUnit.trim().toLowerCase();
  const normalizedToUnit = toUnit.trim().toLowerCase();

  // If normalized units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    console.log('Normalized units are the same, no conversion needed');
    return value;
  }

  // Get conversion factor
  const fromFactors = CONVERSION_FACTORS[fromUnit] || CONVERSION_FACTORS['default'];
  const conversionFactor = fromFactors[toUnit] || fromFactors['default'] || 1;

  console.log(`Conversion factor from ${fromUnit} to ${toUnit}: ${conversionFactor}`);
  console.log(`Converted value: ${value} * ${conversionFactor} = ${value * conversionFactor}`);

  return value * conversionFactor;
}

/**
 * Check if a consumption amount is valid based on available balance
 * @param consumptionAmount The amount to consume
 * @param consumptionUnit The unit of the consumption amount
 * @param availableBalance The available balance
 * @param stockUnit The unit of the available balance
 * @returns True if the consumption amount is valid, false otherwise
 */
export function isValidConsumption(
  consumptionAmount: number,
  consumptionUnit: string,
  availableBalance: number,
  stockUnit: string
): boolean {
  console.log(`Validating consumption: ${consumptionAmount} ${consumptionUnit} against balance: ${availableBalance} ${stockUnit}`);

  // Convert consumption amount to stock unit
  const consumptionInStockUnit = convertUoM(consumptionAmount, consumptionUnit, stockUnit);

  // Calculate new balance
  const newBalance = availableBalance - consumptionInStockUnit;
  console.log(`New balance would be: ${newBalance} ${stockUnit}`);

  // Check if consumption amount is less than or equal to available balance
  // and ensure the new balance is not negative
  const isValid = consumptionInStockUnit <= availableBalance && newBalance >= 0;
  console.log(`Consumption validation result: ${isValid ? 'Valid' : 'Invalid'}`);

  return isValid;
}

/**
 * Get the maximum consumption amount in consumption unit
 * @param availableBalance The available balance
 * @param stockUnit The unit of the available balance
 * @param consumptionUnit The unit of the consumption amount
 * @returns The maximum consumption amount in consumption unit
 */
export function getMaxConsumptionAmount(
  availableBalance: number,
  stockUnit: string,
  consumptionUnit: string
): number {
  console.log(`Calculating max consumption amount: ${availableBalance} ${stockUnit} in ${consumptionUnit}`);

  // Convert available balance to consumption unit
  const maxAmount = convertUoM(availableBalance, stockUnit, consumptionUnit);
  console.log(`Max consumption amount: ${maxAmount} ${consumptionUnit}`);

  return maxAmount;
}
